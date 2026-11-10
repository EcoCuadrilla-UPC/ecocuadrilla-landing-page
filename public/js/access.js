'use strict';

/* Código QR de la credencial, control de ingresos y salidas, y registros sin
   conexión. US42–US43, US45–US46 y US54–US56. Pantallas W06, W15 y W16.
   Daniel Ruben Gutierrez Galvez.

   Depende de window.ecqQR (qr.js) para dibujar la credencial. */

(function () {

  /* Ingreso o Salida: lo elige la pestaña de W15 y vale hasta que se cambie. */
  let scanMode = 'Ingreso';

  const CODE = 'ECQ-0248';

  const named = (ctx, label) => ctx.all('[data-name]').find(e => e.dataset.name === label);

  const initials = name => name.split(' ').map(n => n[0]).slice(0, 2).join('');

  /* Repite una fila del diseño tantas veces como registros haya, sin inventar
     componentes nuevos. */
  const cloneRows = (container, rows, values) => {
    if (!container || !rows.length) return;
    const template = rows[0].cloneNode(true);
    rows.forEach(r => r.remove());
    for (const fill of values) {
      const row = template.cloneNode(true);
      fill(row);
      container.append(row);
    }
  };

  const BUTTONS = {
    w06: {'Descargar QR': 'qr-download', 'Ver a pantalla completa': 'qr-full'},
    w15: {'Simular escaneo': 'scan', 'Registrar': 'access', 'Registrar salida': 'exit'},
    w16: {'Sincronizar ahora': 'sync'}
  };

  /* US45 y US46. Un ingreso exige registro, capacitación, asignación y EPP
     completos; una salida exige un ingreso activo. Devuelve '' si se registró,
     o el motivo del rechazo. Sin conexión el registro queda por sincronizar. */
  function writeAccess(v, type, ctx) {
    if (type === 'Ingreso') {
      if (v.inside) return 'El voluntario ya tiene un ingreso activo.';
      if (!ctx.ready(v)) return 'Ingreso bloqueado: completa registro, capacitación, asignación y EPP.';
      v.inside = true;
    } else {
      if (!v.inside) return 'El voluntario no tiene un ingreso activo.';
      v.inside = false;
    }
    ctx.state.records.push({
      id: ctx.id(),
      volunteer: v.id,
      type,
      zone: ctx.state.selectedZone,
      synced: !ctx.state.offline,
      time: new Date().toISOString()
    });
    return '';
  }

  function setup(page, ctx) {

    /* US42: la credencial se genera en el navegador, no es una imagen del diseño. */
    if (page === 'w06') {
      const target = ctx.all('[data-name="QR"]')[0];
      if (target) {
        target.innerHTML = window.ecqQR(CODE);
        target.querySelector('svg').style.cssText = 'width:100%;height:100%';
      }
      ctx.replace('Playa Costa Azul · desde las 09:12',
        ctx.me().inside ? 'Dentro de ' + ctx.zone().name : 'Fuera de la zona');
    }

    if (page === 'w15') {
      ctx.nativeSelect('Zona', ctx.state.zones.map(z => [z.id, z.name]), ctx.state.selectedZone)
        ?.addEventListener('change', e => { ctx.state.selectedZone = e.target.value; ctx.save(); });
      ctx.caption('Ingreso', 'scan-mode:Ingreso');
      ctx.caption('Salida', 'scan-mode:Salida');
    }

    if (page === 'w16') {
      const pending = ctx.state.records.filter(r => !r.synced).length;
      ctx.replace('7 registros', pending + ' registros');
      ctx.replace('0 de 7', '0 de ' + pending);
      if (!ctx.state.offline) ctx.replace('Esperando conexión', 'Listo para sincronizar');
    }
  }

  function live(page, ctx) {

    /* US46: la tabla «Dentro de la zona» refleja quién tiene un ingreso activo. */
    if (page === 'w15') {
      const table = named(ctx, 'Dentro de la zona');
      const rows = table
        ? [...table.children].filter(e => ctx.state.volunteers.some(v => v.name.startsWith(e.dataset.name)))
        : [];
      cloneRows(table, rows, ctx.state.volunteers.filter(v => v.inside).map(v => row => {
        row.dataset.name = v.name;
        const ps = ctx.all('p', row);
        ctx.text(ps[0], initials(v.name));
        ctx.text(ps[1], v.name);
        const b = row.querySelector('[data-button]');
        if (b) ctx.bind(b, 'exit:' + v.id);
      }));

      ctx.replace('21 personas', ctx.state.volunteers.filter(v => v.inside).length + ' personas');
      /* Avisos de ejemplo del diseño que no corresponden a estos datos. */
      ctx.all('p').filter(p => p.textContent.startsWith('y 15 personas más')).forEach(p => p.hidden = true);
      ctx.all('p').filter(p => p.textContent.includes('Luis Ramírez superó su turno')
        || p.textContent.startsWith('Lleva más de 3 horas')).forEach(p => p.hidden = true);

      const success = named(ctx, 'Ingreso registrado')
        || ctx.all('[data-name]').find(e => e.dataset.name?.startsWith('Ingreso registrado'));
      if (success) success.hidden = !ctx.state.records.some(r => r.volunteer === ctx.me().id && r.type === 'Ingreso');
    }

    /* US55: cola de registros que esperan sincronización. */
    if (page === 'w16') {
      const table = named(ctx, 'Registros pendientes');
      const rows = table
        ? [...table.children].filter(e => ctx.state.volunteers.some(v => v.name.startsWith(e.dataset.name)))
        : [];
      cloneRows(table, rows, ctx.state.records.filter(r => !r.synced).map(r => row => {
        const ps = ctx.all('p', row);
        [
          r.type,
          ctx.state.volunteers.find(v => v.id === r.volunteer)?.name || 'Voluntario',
          ctx.state.zones.find(z => z.id === r.zone)?.name || 'Zona',
          new Date(r.time).toLocaleTimeString('es-PE', {hour: '2-digit', minute: '2-digit'}),
          'En cola'
        ].forEach((value, i) => ctx.text(ps[i], value));
      }));

      const n = ctx.state.records.filter(r => !r.synced).length;
      ctx.replace('7 en cola', n + ' en cola');
      ctx.replace('7 registros pendientes', n + ' registros pendientes');
    }
  }

  /* Devuelve 'done' si ya terminó, 'render' si main.js debe guardar y repintar,
     o false si la acción no es de esta parte. */
  function handle(action, param, el, ctx) {
    switch (action) {

      case 'scan-mode':
        scanMode = param;
        ctx.notice('Modo ' + param);
        return 'done';

      /* US43: lectura simulada; no hay cámara ni servidor. */
      case 'scan':
        ctx.setField('Código del voluntario', CODE);
        ctx.notice('Credencial simulada leída.');
        return 'done';

      case 'access': {
        if (ctx.read('Código del voluntario') !== CODE) {
          ctx.notice('Credencial no encontrada.');
          return 'done';
        }
        const error = writeAccess(ctx.me(), scanMode, ctx);
        ctx.notice(error || scanMode + ' registrado' + (ctx.state.offline ? ' · por sincronizar' : ''));
        return 'render';
      }

      case 'exit':
        ctx.notice(writeAccess(ctx.state.volunteers.find(v => v.id === param) || ctx.me(), 'Salida', ctx)
          || 'Salida registrada.');
        return 'render';

      /* US54: modo sin conexión simulado; los registros quedan en cola. */
      case 'offline':
        ctx.state.offline = !ctx.state.offline;
        ctx.notice(ctx.state.offline ? 'Modo sin conexión simulado.' : 'Conexión recuperada.');
        return 'render';

      /* US56: la sincronización necesita conexión. */
      case 'sync':
        if (ctx.state.offline) { ctx.notice('Recupera la conexión para sincronizar.'); return 'done'; }
        ctx.state.records.forEach(r => r.synced = true);
        ctx.notice('Sincronización simulada completada.');
        return 'render';

      case 'qr-full':
        ctx.openDialog('Credencial de María', window.ecqQR(CODE));
        return 'done';

      case 'qr-download': {
        const url = URL.createObjectURL(new Blob([window.ecqQR(CODE)], {type: 'image/svg+xml'}));
        const a = document.createElement('a');
        a.href = url;
        a.download = CODE + '.svg';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return 'done';
      }

    }
    return false;
  }

  window.ecqAccess = {BUTTONS, writeAccess, setup, live, handle};

})();
