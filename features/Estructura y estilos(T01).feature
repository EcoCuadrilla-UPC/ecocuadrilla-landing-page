Feature: T01 - Estructura base y estilos compartidos
As a desarrollador
I want que la aplicacion tenga una estructura y estilos base definidos
So that la navegacion sea fluida y la interfaz mantenga consistencia visual

Scenario: La aplicacion carga con la estructura y navegacion correctas
  Given que el usuario accede a la URL raiz de la aplicacion web
  When la pagina principal termina de renderizarse
  Then se debe mostrar la barra de navegacion global operativa
  And los estilos compartidos deben aplicarse correctamente sin errores.
