Feature: T06 - Gestión de EPP y control de acceso mediante código QR
As a coordinador de crisis
I want verificar el cumplimiento de EPP y controlar el acceso escaneando códigos QR
So that garantice que solo ingresen voluntarios protegidos y autorizados
#ID de US asociados: US35 - US44

Scenario: Verificación de EPP completo y registro de ingreso exitoso con QR
  Given que un voluntario cuenta con su código QR generado en su perfil
  And he registrado la entrega de todos sus EPP obligatorios marcándolos como "Entregado"
  When toco "Verificar EPP" y el sistema confirma que el voluntario "Puede ingresar a la zona"
  And escaneo su código QR utilizando el modo "Ingreso"
  Then el sistema aprueba y registra el ingreso contabilizando al voluntario dentro de la zona
  And el voluntario puede visualizar en su propia pantalla que su estado actual es "Ingreso activo"

  