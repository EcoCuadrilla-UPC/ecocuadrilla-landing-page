Feature: T04 - Gestión de zonas, riesgos y recomendaciones de seguridad
As a especialista ambiental
I want registrar zonas, evaluar sus riesgos y publicar recomendaciones de seguridad
So that los participantes conozcan las restricciones y trabajen de forma segura
#ID de US asociados: US14 - US23

Scenario: Registro de zona con riesgo alto y publicación de recomendaciones
  Given que he registrado exitosamente una zona con su ubicación y descripción
  And he definido su "Nivel de riesgo" como "Alto"
  When publico una nueva recomendación de seguridad obligatoria para esta zona
  Then la zona queda disponible en el sistema con la etiqueta de riesgo correspondiente
  And los voluntarios asignados a esta zona pueden visualizar la recomendación publicada
  And el sistema me permite actualizar esta recomendación conservando un historial si las condiciones cambian

Scenario: Falla al registrar una zona por falta de nombre
  Given que el especialista ambiental está en el formulario "Nueva zona afectada"
  And ha dejado el campo "Nombre de la zona" vacío
  When presiona el botón "Registrar zona"
  Then el sistema muestra el mensaje de validación "Dato obligatorio. Escribe el nombre de la zona."
  And la zona no se registra en la base de datos

Scenario: Actualización de zona a estado no apto
  Given que la zona tiene actividades en curso
  When el especialista actualiza el "Estado de la zona" a "No apta"
  Then la zona cambia su estado mostrando la etiqueta "Alerta de seguridad"
  And los coordinadores y voluntarios ven la restricción reflejada inmediatamente

  