# EcoCuadrilla · implementación del Figma

Landing y demo web en HTML, CSS y JavaScript. Sin instalación de paquetes ni compilación.

## Ejecutar en Windows

1. Abre la carpeta del proyecto en WebStorm.
2. En la terminal de esa carpeta ejecuta:

```powershell
py -m http.server 5500 --directory public
```

3. Abre http://localhost:5500. También puedes usar Live Server.

Es necesario un servidor local porque las pantallas se cargan desde `public/pages/`. No abras `public/index.html` directamente con `file://`.

## Diseño

Referencia: Figma `f0sIxBHt0DQPAVskX8MFOa`.

- Landing de escritorio: frame 279:783, 1440 × 7723.
- Landing móvil: frame 288:1656, 360 × 10565.
- Demo: 16 pantallas web W01–W16 del diseño, con menú lateral y recursos originales.
- La landing se escala proporcionalmente al ancho de la ventana. La demo conserva la composición de escritorio; en móvil permite desplazamiento horizontal.
- Los textos, cantidades y estados cambian cuando realizas acciones en la demo. Las vistas adicionales de alertas, tareas y recomendaciones reutilizan la estructura visual; no tienen un frame independiente de referencia.

## Archivos

- `public/index.html`: entrada.
- `public/pages/`: secciones y pantallas originales convertidas a HTML.
- `public/figma.css`: estilos de los componentes del diseño, ya compilados.
- `public/assets/styles/styles.css`: tipografía local, contenedores y controles nativos.
- `public/assets/scripts/main.js`: interacción y datos de demostración compartidos por los tres roles.
- `js/epp.js`: entrega, consulta, verificación y devolución de EPP.
- `js/access.js`: credencial QR, ingresos y salidas, modo sin conexión y sincronización.
- `qr.js`: genera el QR de demostración ECQ-0248.
- `assets/`: SVG originales y fuentes Inter con licencia.
- `features/`: escenarios de aceptación en Gherkin.
- `docs/`: mapa de pantallas, historias y comprobaciones.

Los módulos de `js/` se cargan antes que `public/assets/scripts/main.js` y se registran en `window`,
igual que `qr.js`. No leen variables globales: `public/assets/scripts/main.js` les pasa el estado y los
ayudantes en un objeto `ctx`. Ver `docs/integracion.md`.

## Recorrido

1. Probar la demo → Voluntaria. Completa el celular del contacto, acepta el uso de datos ficticios y continúa.
2. Guarda experiencia, habilidades y disponibilidad. Confirma los módulos de seguridad.
3. Mi tarea permanece bloqueada mientras falte EPP.
4. Cambia de rol desde el avatar. Como coordinadora, abre EPP y registra la entrega a María.
5. Como voluntaria, inicia y finaliza la tarea; consulta y descarga su QR.
6. Como coordinadora, crea una tarea, selecciona candidatos compatibles y asigna sin superar la capacidad.
7. Como especialista, registra zonas y riesgos, define condiciones de una actividad y comunica cambios de seguridad.
8. En Ingresos y salidas usa «Simular escaneo». El ingreso exige registro, capacitación, tarea y EPP completos. «Simular sin conexión» deja movimientos pendientes para una sincronización simulada.

Los datos son ficticios y se guardan en `sessionStorage`: sobreviven a la recarga de la misma pestaña, y se eliminan al cerrar su sesión. No hay autenticación, servidor de datos ni sincronización real entre personas. Los videos y el APK requieren los archivos finales del equipo; sus botones informan cuando todavía no están añadidos.

## Reparto del equipo

| Parte | Responsable | Alcance |
|---|---|---|
| 1 | Alvar Lucas Córdova | Integración general y despliegue |
| 2 | Stefano Valentino Erazo Huapaya | Landing de escritorio y móvil |
| 3 | Luis Chaupis Romani | Registro de voluntarios y capacitación |
| 4 | Jethro Ander Aliaga Romero | Zonas, riesgos y alertas |
| 5 | Diego Armando Cortez Benites | Creación y asignación de tareas |
| 6 | Daniel Ruben Gutierrez Galvez | EPP, credencial QR, accesos y sincronización |

La parte 6 está en `js/epp.js`, `js/access.js`, `qr.js`, las pantallas W06, W14,
W15 y W16, y `features/`. Su documentación está en `docs/epp-qr.md`.
