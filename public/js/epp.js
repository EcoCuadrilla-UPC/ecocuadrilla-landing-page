'use strict';

/* Entrega, consulta, verificación y devolución de EPP. US36–US40. Pantalla W14.
   Daniel Ruben Gutierrez Galvez.

   El módulo no toca variables globales de main.js: recibe `ctx` con el estado y
   los ayudantes compartidos. Ver docs/epp-qr.md para el contrato completo. */

(function () {

  const named = (ctx, label) => ctx.all('[data-name]').find(e => e.dataset.name === label);

  /* Botones del diseño que esta parte activa. main.js los une a su mapa general. */
  const BUTTONS = {
    w14: {
      'Cambiar voluntario': 'choose-volunteer',
      'Registrar devolución': 'return-epp',
      'Registrar entrega': 'deliver-epp',
      'Verificar de nuevo': 'verify'
    }
  };

  /* Texto fijo del diseño que depende del voluntario seleccionado. */
  function setup(page, ctx) {
    if (page !== 'w14') return;
    const v = ctx.selected();
    ctx.replace('María Quispe Rojas', v.name);
    if (v.epp.includes(2)) {
      ctx.replace('2 de 3 entregados', '3 de 3 entregados');
      ctx.replace('Talla 39 · sin stock en el punto A', 'Talla 39 · entregada');
    }
  }

  /* US37 y US40: el EPP recibido y las entregas recientes salen del estado,
     sobre las mismas filas y tarjetas del diseño. */
  function live(page, ctx) {
    if (page !== 'w14') return;
    const v = ctx.selected();
    const t = ctx.state.tasks.find(t => t.id === v.task);
    const z = t && ctx.state.zones.find(z => z.id === t.zone);
    const a = z && z.activities.find(a => a.id === t.activity);

    if (a) {
      const count = a.epp.filter(e => v.epp.includes(e)).length;
      ctx.replace('2 de 3', count + ' de ' + a.epp.length);

      /* US38: el resultado de la verificación previa al ingreso. */
      if (ctx.ready(v)) {
        ctx.replace('No puede ingresar a la zona', 'Puede ingresar a la zona');
        ctx.replace(
          'Falta 1 EPP obligatorio: botas de jebe. Entrégalo y vuelve a verificar.',
          'Registro, capacitación, asignación y EPP verificados.'
        );
      }

      const panel = named(ctx, 'EPP requerido');
      if (panel) for (const e of a.epp) {
        const row = ctx.all('[data-name]', panel).find(r => r.dataset.name === ctx.EPP[e]);
        if (!row) continue;
        const ps = ctx.all('p', row);
        ctx.text(ps[ps.length - 2], v.epp.includes(e) ? 'Entregado' : 'Pendiente');
      }
    }

    const recent = named(ctx, 'Entregas recientes');
    if (recent) {
      ctx.bind(recent, 'epp-history');
      for (const row of [...recent.children]) {
        const person = ctx.state.volunteers.find(x => x.name.startsWith(row.dataset.name));
        if (person) ctx.bind(row, 'select-volunteer:' + person.id);
      }
    }
  }

  /* Devuelve 'done' si ya terminó, 'render' si main.js debe guardar y repintar,
     o false si la acción no es de esta parte. */
  function handle(action, param, el, ctx) {
    switch (action) {

      case 'choose-volunteer':
        ctx.openDialog('Cambiar voluntario', ctx.state.volunteers
          .map(v => `<p><button data-action="select-volunteer:${v.id}">${ctx.safe(v.name)}</button></p>`)
          .join(''));
        return 'done';

      case 'select-volunteer':
        ctx.state.selectedVolunteer = param;
        ctx.save();
        ctx.modal.close();
        ctx.render();
        return 'done';

      /* US40: historial de entregas y devoluciones de la sesión. */
      case 'epp-history':
        ctx.openDialog('Historial de entregas y devoluciones', ctx.state.equipmentHistory.length
          ? ctx.state.equipmentHistory.map(h => '<p>'
              + ctx.safe(ctx.state.volunteers.find(v => v.id === h.volunteer)?.name) + ' · '
              + ctx.safe(h.type) + ' · '
              + ctx.safe(ctx.EPP[h.epp]) + ' · '
              + new Date(h.date).toLocaleString('es-PE') + '</p>').join('')
          : '<p>Aún no hay movimientos en esta sesión.</p>');
        return 'done';

      /* US38: verificación antes del ingreso, requisito por requisito. */
      case 'verify':
        ctx.openDialog('Verificación antes del ingreso',
          Object.entries(ctx.requirements(ctx.selected()))
            .map(([k, ok]) => `<p>${ok ? '✓' : '△'} ${ctx.safe(k)}: ${ok ? 'cumplido' : 'pendiente'}</p>`)
            .join(''));
        return 'done';

      /* US36: solo se entrega el EPP que exige la actividad y aún falta. */
      case 'deliver-epp': {
        const v = ctx.selected();
        const t = ctx.state.tasks.find(t => t.id === v.task);
        const a = t && ctx.state.zones.find(z => z.id === t.zone).activities.find(a => a.id === t.activity);
        if (!a) { ctx.notice('Asigna una tarea primero.'); return 'done'; }
        const missing = a.epp.filter(e => !v.epp.includes(e));
        if (!missing.length) { ctx.notice('El equipo ya está completo.'); return 'done'; }
        missing.forEach(e => {
          v.epp.push(e);
          ctx.state.equipmentHistory.push({volunteer: v.id, epp: e, type: 'Entrega', date: new Date().toISOString()});
        });
        ctx.notice('Entrega de EPP registrada.');
        return 'render';
      }

      /* US39: no se devuelve EPP con la tarea en curso o con un ingreso activo. */
      case 'return-epp': {
        const v = ctx.selected();
        if (v.inside || v.status === 'En curso') {
          ctx.notice('Finaliza la tarea y registra la salida antes de devolver EPP.');
          return 'done';
        }
        v.epp.forEach(e => ctx.state.equipmentHistory.push({
          volunteer: v.id, epp: e, type: 'Devolución', date: new Date().toISOString()
        }));
        v.epp = [];
        ctx.notice('Devolución registrada.');
        return 'render';
      }

    }
    return false;
  }

  window.ecqEPP = {BUTTONS, setup, live, handle};

})();
