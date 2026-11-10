'use strict';

/*
 * EcoCuadrilla - correcciones QA del AV2.
 *
 * Conserva los modulos existentes y corrige informacion
 * visual que debe reflejar el estado de la demostracion.
 *
 * Los datos permanecen exclusivamente en sessionStorage.
 */

(() => {

  const root = document.getElementById('app');

  if (!root) return;

  const query = (selector, base = root) =>
    base ? [...base.querySelectorAll(selector)] : [];

  const paragraphs = () => query('p');

  const exact = value =>
    paragraphs().find(p => p.textContent.trim() === value);

  function setText(element, value) {
    if (!element) return;

    const next = String(value ?? '');

    if (element.textContent.trim() !== next) {
      element.textContent = next;
    }
  }

  function replaceExact(oldValue, newValue) {
    paragraphs()
      .filter(p => p.textContent.trim() === oldValue)
      .forEach(p => setText(p, newValue));
  }

  function replaceBeginning(prefix, newValue) {
    paragraphs()
      .filter(p => p.textContent.trim().startsWith(prefix))
      .forEach(p => setText(p, newValue));
  }

  function cardNumber(name, number) {
    const card = query('[data-name]').find(
      el => el.dataset.name === name
    );

    if (!card) return;

    const numberElement = query('p', card).find(
      p => /^\d+$/.test(p.textContent.trim())
    );

    setText(numberElement, number);
  }

  function currentRoute() {
    return location.hash.slice(1) || 'landing';
  }

  function taskZone(task) {
    return state.zones.find(z => z.id === task?.zone);
  }

  function insideCount(zoneId) {
    return state.volunteers.filter(v =>
      v.inside &&
      taskZone(state.tasks.find(t => t.id === v.task))?.id === zoneId
    ).length;
  }

  // ======================================================
  // E-01: EDITAR RECOMENDACIONES
  // ======================================================

  document.addEventListener('click', event => {

    const button = event.target.closest(
      '[data-action^="recommendation:"]'
    );

    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const zoneId = button.dataset.action.split(':')[1];
    const selectedZone = state.zones.find(z => z.id === zoneId);

    if (!selectedZone) {
      notice('No se encontro la zona seleccionada.');
      return;
    }

    state.selectedZone = selectedZone.id;

    manualForm(
      'Recomendación de seguridad',
      'recommendation',
      input(
        'Indicación',
        'text',
        selectedZone.recommendation || ''
      )
    );

  }, true);

  // ======================================================
  // E-02: BUSQUEDA FUNCIONAL DE VOLUNTARIOS
  // ======================================================

  function fixVolunteerSearch() {

    if (document.getElementById('ecq-qa-volunteer-search')) {
      return;
    }

    const placeholder = exact('Buscar por nombre o DNI');

    if (!placeholder) return;

    const holder = placeholder.parentElement;

    if (!holder) return;

    holder.classList.add('ecq-qa-search-holder');

    placeholder.style.visibility = 'hidden';

    const search = document.createElement('input');

    search.id = 'ecq-qa-volunteer-search';
    search.type = 'search';
    search.placeholder = 'Buscar por nombre o DNI';
    search.setAttribute('aria-label', 'Buscar por nombre o DNI');
    search.className = 'ecq-qa-search-input';

    holder.append(search);

    search.addEventListener('input', () => {

      const value = search.value.trim().toLowerCase();

      const table = query('[data-name="Tabla de voluntarios"]')[0];

      if (!table) return;

      const rows = query('[data-name="Fila"]', table);

      const volunteerRows = rows.filter(row =>
        state.volunteers.some(v =>
          row.textContent.includes(
            v.name.split(' ').slice(0, 2).join(' ')
          )
        )
      );

      volunteerRows.forEach(row => {

        const matches = row.textContent
          .toLowerCase()
          .includes(value);

        row.style.display = matches ? '' : 'none';
      });

    });
  }

  // ======================================================
  // E-03: DATOS REALES DE TAREAS Y CAPACIDAD
  // ======================================================

  function fixTaskDetails() {

    const task = selectedTask();
    const zone = taskZone(task);

    if (!task || !zone) return;

    replaceExact(
      'Playa Costa Azul · Hoy 09:30 – 12:30',
      `${zone.name} · ${task.date || 'Hoy'} · ${task.start} – ${task.end}`
    );

    const assigned = state.volunteers.filter(
      v => v.task === task.id
    ).length;

    const capacity = paragraphs().find(p =>
      /^\d+ de 8$/.test(p.textContent.trim())
    );

    setText(capacity, `${assigned} de ${task.capacity}`);
  }

  // ======================================================
  // E-04: ZONAS, RIESGOS Y DATOS ACTUALIZADOS
  // ======================================================

  function fixZoneDetails() {

    const selectedZone = zone();

    if (!selectedZone) return;

    replaceExact(
      'Zonas / Playa Costa Azul',
      `Zonas / ${selectedZone.name}`
    );

    replaceBeginning(
      'Playa Costa Azul · se publicará',
      `${selectedZone.name} · actualización de seguridad de esta demostración.`
    );

    cardNumber(
      'Voluntarios dentro',
      insideCount(selectedZone.id)
    );

    const activitiesCard = query('[data-name]').find(
      el => el.dataset.name === 'Actividades permitidas'
    );

    if (activitiesCard) {

      const current = query('p', activitiesCard).find(p =>
        /^\d+ de \d+$/.test(p.textContent.trim())
      );

      const allowed = selectedZone.activities.filter(
        activity => activity.allowed
      ).length;

      setText(
        current,
        `${allowed} de ${selectedZone.activities.length}`
      );
    }

    replaceBeginning(
      '21 voluntarios en la zona',
      `${insideCount(selectedZone.id)} voluntarios en la zona`
    );
  }

  // ======================================================
  // E-05: COHERENCIA ENTRE EPP, TAREAS Y ZONAS
  // ======================================================

  function fixEquipmentDetails() {

    const volunteer = selected();

    const task = state.tasks.find(
      item => item.id === volunteer.task
    );

    const zone = taskZone(task);

    if (!task || !zone) return;

    replaceExact(
      'Limpieza de arena · sector norte · Playa Costa Azul',
      `${task.name} · ${zone.name}`
    );
  }

  function fixAccessDetails() {

    const selectedZone = state.zones.find(
      z => z.id === state.selectedZone
    );

    if (!selectedZone) return;

    replaceExact(
      'Dentro de Playa Costa Azul',
      `Dentro de ${selectedZone.name}`
    );

    const records = state.records.filter(
      record => record.zone === selectedZone.id
    );

    const latest = records[records.length - 1];

    if (latest) {

      const volunteer = state.volunteers.find(
        v => v.id === latest.volunteer
      );

      const name = volunteer?.name || 'Voluntario';

      replaceBeginning(
        'María Quispe ingresó a Playa Costa Azul',
        `${name}: ${latest.type.toLowerCase()} registrado en ${selectedZone.name}.`
      );

    } else {

      replaceBeginning(
        'María Quispe ingresó a Playa Costa Azul',
        'Aún no hay movimientos registrados en esta zona.'
      );
    }
  }

  function fixVolunteerQR() {

    const inside = !!me().inside;

    replaceExact(
      'Ingreso activo',
      inside ? 'Ingreso activo' : 'Sin ingreso activo'
    );

    replaceExact(
      'Fuera de la zona',
      inside ? 'Dentro de la zona' : 'Fuera de la zona'
    );
  }

  // ======================================================
  // E-06: ESTADO DE CONEXION Y SINCRONIZACION
  // ======================================================

  function fixConnection() {

    const connection = state.offline
      ? 'Sin conexión'
      : 'En línea';

    paragraphs()
      .filter(p => {
        const value = p.textContent.trim();

        return value === 'En línea' ||
               value === 'Sin conexión';
      })
      .forEach(p => setText(p, connection));

    if (!state.offline) {

      replaceExact(
        'Los ingresos y salidas se guardan en este dispositivo y se enviarán cuando vuelva la señal.',
        'Conexión disponible. Puedes sincronizar los registros pendientes.'
      );
    }
  }

  // ======================================================
  // E-07: INDICADORES DEL DASHBOARD
  // ======================================================

  function fixDashboard() {

    const registered = state.volunteers.filter(
      v => v.registered
    ).length;

    const available = state.volunteers.filter(
      v => v.registered &&
           v.modules.length === 3 &&
           !v.task
    ).length;

    const assigned = state.volunteers.filter(
      v => !!v.task
    ).length;

    const inside = state.volunteers.filter(
      v => !!v.inside
    ).length;

    cardNumber('Registrados', registered);
    cardNumber('Disponibles', available);
    cardNumber('Asignados', assigned);
    cardNumber('Activos en zona', inside);

    replaceExact(
      '71 registrados · 18 disponibles para asignar',
      `${registered} registrados · ${available} disponibles para asignar`
    );
  }

  // ======================================================
  // E-08: PREGUNTAS FRECUENTES
  // ======================================================

  const answers = {

    '¿Qué pasa si no tengo señal en la zona?':
      'Los registros de ingreso y salida se guardan localmente en la demostración. Cuando recuperas la conexión, puedes simular su sincronización.',

    '¿Quién decide si una zona es segura?':
      'El especialista ambiental evalúa los riesgos y define el estado de la zona y las actividades permitidas.',

    '¿Para qué sirve mi código QR?':
      'Permite identificar al voluntario y registrar sus ingresos y salidas de las zonas de trabajo.',

    '¿Qué equipo de protección necesito?':
      'Depende de la actividad y del nivel de riesgo. El especialista establece los requisitos y el coordinador verifica la entrega.',

    '¿EcoCuadrilla reemplaza a las autoridades?':
      'No. Es una propuesta académica para apoyar la coordinación del voluntariado. Las autoridades conservan sus responsabilidades.'
  };

  document.addEventListener('click', event => {

    const target = event.target.closest('[data-action="faq"]');

    if (!target) return;

    const question = Object.keys(answers).find(
      key => target.textContent.includes(key)
    );

    if (!question) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    let answer = target.parentElement.querySelector(
      '[data-answer]'
    );

    if (!answer) {

      answer = document.createElement('p');
      answer.dataset.answer = 'true';
      answer.className = 'ecq-qa-faq-answer';
      answer.textContent = answers[question];

      target.parentElement.append(answer);

    } else {

      answer.hidden = !answer.hidden;
    }

  }, true);

  // ======================================================
  // APLICACION DE CORRECCIONES POR PANTALLA
  // ======================================================

  function applyFixes() {

    const route = currentRoute();

    if (route === 'landing') return;

    fixConnection();

    switch (route) {

      case 'w06':
        fixVolunteerQR();
        break;

      case 'w10':
        fixDashboard();
        break;

      case 'w11':
        fixVolunteerSearch();
        fixDashboard();
        break;

      case 'w13':
        fixTaskDetails();
        break;

      case 'w08':
      case 'w09':
        fixZoneDetails();
        break;

      case 'w14':
        fixEquipmentDetails();
        break;

      case 'w15':
        fixAccessDetails();
        break;
    }
  }

  let scheduled = false;

  const observer = new MutationObserver(() => {

    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyFixes();
    });
  });

  observer.observe(root, {
    childList: true,
    subtree: true
  });

  window.addEventListener('hashchange', () => {
    setTimeout(applyFixes, 100);
  });

  applyFixes();

})();