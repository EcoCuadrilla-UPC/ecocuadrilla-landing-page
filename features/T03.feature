Feature: T03 - Flujo de registro y visualización de perfil de voluntario
As a voluntario espontáneo
I want registrar todos mis datos y consultarlos en mi perfil
So that el coordinador sepa que existo y cuáles son mis capacidades
#ID de US asociados: US01 - US08

Scenario: Registro exitoso y validación en la vista de perfil
  Given que estoy en el flujo de registro de voluntario
  And he completado todos los campos obligatorios de datos personales, experiencia, habilidades y disponibilidad
  When presiono el botón "Finalizar registro"
  Then el sistema guarda mi información y crea mi cuenta
  And al ingresar a la vista "Mi perfil", veo mis datos registrados de manera exacta y sin errores de validación

Scenario: Un campo obligatorio está vacío en el primer paso
  Given que estoy en el paso "Paso 1 de 3 · Datos personales"
  And he dejado un campo vacío
  When presiono "Continuar"
  Then el campo vacío muestra el mensaje "Dato obligatorio pendiente."
  And permanezco en el "Paso 1 de 3 · Datos personales"

