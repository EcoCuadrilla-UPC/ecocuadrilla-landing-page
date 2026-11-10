Feature: T05 - Asignación de tareas a voluntarios en zonas permitidas
As a coordinador de crisis
I want crear una tarea en una zona y asignar personal calificado
So that la emergencia se atienda de manera ordenada
#ID de US asociados: US24 - US34

Scenario: Asignación de un voluntario que cumple los requisitos
  Given que he creado una tarea asociada a una zona que permite dicha actividad
  When selecciono a un voluntario que cumple con la capacitación y experiencia requerida
  And confirmo la asignación presionando "Asignar"
  Then el voluntario queda vinculado a la tarea
  And el voluntario puede ver esta información al ingresar a "Mi tarea" en su aplicación

Scenario: El voluntario no cumple un requisito obligatorio de la tarea
  Given que el voluntario no ha completado la capacitación de seguridad
  When intento asignarlo a la tarea seleccionándolo en la lista de candidatos
  Then el voluntario se muestra como "No cumple: capacitación pendiente"
  And la asignación es rechazada por el sistema

  