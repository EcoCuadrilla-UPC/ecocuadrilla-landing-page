Feature: T02 - Landing page informativa responsiva
As a visitante de la web
I want ver información clara sobre la iniciativa en cualquier dispositivo
So that pueda informarme correctamente antes de decidir registrarme

Scenario: Visualización responsiva de la landing page en dispositivos móviles
  Given que un usuario no autenticado ingresa a la landing page desde un teléfono móvil
  When navega desplazándose hacia abajo por las secciones informativas
  Then los elementos visuales y textos deben ajustarse automáticamente al ancho de la pantalla
  And la información debe ser completamente legible sin necesidad de hacer scroll horizontal

  