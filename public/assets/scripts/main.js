'use strict';

// Una única demo local: todos los roles comparten los mismos datos.
const KEY = 'ecocuadrilla-figma-v1';
const EPP = ['Guantes de nitrilo', 'Mascarilla N95', 'Botas de jebe', 'Lentes de seguridad', 'Traje Tyvek'];
const LEVELS = ['Sin experiencia', 'Básica', 'Intermedia', 'Avanzada', 'Especializada'];
const MODULES = [
  ['Riesgos de la zona', 'No manipules crudo ni fauna afectada sin autorización. Respeta las áreas delimitadas y avisa si identificas un nuevo riesgo.'],
  ['Uso correcto del EPP', 'Usa guantes que cubran tus muñecas, ajusta la mascarilla a nariz y boca y utiliza botas de jebe. No empieces si te falta equipo.'],
  ['Rutas y puntos seguros', 'Ubica el punto de encuentro y sigue la ruta indicada por el coordinador. Ante una alerta detén la tarea y espera instrucciones.']
];
const MENUS = {
  volunteer: [['profile','Mi perfil'],['training','Capacitación'],['my-task','Mi tarea'],['zones','Zonas y riesgos'],['alerts','Alertas']],
  coordinator: [['volunteers','Voluntarios'],['tasks','Tareas'],['equipment','EPP'],['zones','Zonas y riesgos'],['alerts','Alertas']],
  specialist: [['zones','Zonas y riesgos'],['alerts','Alertas']]
};
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
const safe = escapeHTML;

function initialData() {
  const activity = () => ({id:id(),name:'Limpieza de arena',allowed:true,experience:'Sin experiencia',epp:[0,1,2]});
  return {
    version:1, role:'volunteer', selectedVolunteer:'v1',
    volunteers: [
      {id:'v1',name:'María Quispe Rojas',dni:'74652318',phone:'987654321',district:'Ventanilla',contact:'Rosa Rojas',contactPhone:'986222333',experience:'Básica',skills:['Logística'],days:['Lunes','Miércoles'],from:'08:00',until:'14:00',registered:false,modules:[],epp:[0,1],task:'t1',status:'Asignada'},
      {id:'v2',name:'Carla Mendoza',dni:'72345678',phone:'987111222',district:'Ventanilla',contact:'Contacto de prueba',contactPhone:'986111222',experience:'Sin experiencia',skills:['Comunicación'],days:['Lunes','Viernes'],from:'08:00',until:'15:00',registered:true,modules:[0,1,2],epp:[0,1,2],task:null,status:'Sin asignación'},
      {id:'v3',name:'Renato Gómez',dni:'74567890',phone:'987333444',district:'Callao',contact:'Contacto de prueba',contactPhone:'986333444',experience:'Avanzada',skills:['Primeros auxilios'],days:['Martes','Jueves'],from:'07:00',until:'14:00',registered:true,modules:[0,1,2],epp:[0,1,2,4],task:null,status:'Sin asignación'}
    ],
    zones: [
      {id:'z1',name:'Playa Costa Azul',location:'Sector norte · Ventanilla',risk:'Alto',status:'Restringida',description:'Crudo en arena y rocas.',risks:['Crudo en arena: evita el contacto directo','Oleaje fuerte: no ingreses al mar'],recommendation:'Usa todo tu EPP. Punto de encuentro: caseta de salvavidas norte.',activities:[activity()]},
      {id:'z2',name:'Playa Cavero',location:'Sector centro · Ventanilla',risk:'Medio',status:'Apta',description:'Zona de limpieza controlada.',risks:['Exposición solar'],recommendation:'Usa bloqueador, hidrátate y respeta las áreas delimitadas.',activities:[activity()]}
    ],
    tasks:[{id:'t1',name:'Limpieza de arena · sector norte',zone:'z1',activity:null,date:new Date().toISOString().slice(0,10),start:'09:30',end:'12:30',capacity:3,instructions:'Retira arena con crudo en bolsas rojas y llévalas al punto de acopio. No manipules fauna afectada.'}],
    alerts:[], equipmentHistory:[]
  };
}
let state;
try { state=JSON.parse(sessionStorage.getItem(KEY)); } catch {}
if(!state){state=initialData();state.volunteers[0].modules=[0];state.volunteers[0].birth='1998-03-14';state.volunteers[0].email='maria.quispe@correo.pe';state.volunteers[0].contactPhone='';}
if(state.volunteers.length===3){for(const [i,name]of ['Luis Ramírez','Ana Torres','Diego Salazar','Jorge Huamán'].entries())state.volunteers.push({...state.volunteers[1],id:'v'+(i+4),name,dni:String(71000000+i),epp:[0,1,2],skills:['Logística'],days:['Lunes','Miércoles'],modules:i===2?[0]:[0,1,2]});}
state.records ||= [];state.alerts ||= [];state.equipmentHistory ||= [];state.selectedZone ||= 'z1';state.selectedTask ||= 't1';state.selectedVolunteer ||= 'v1';
if(state.zones.length===2){const template=state.zones[1];for(const [i,name,status,risk]of [[3,'Playa Márquez','Apta','Medio'],[4,'Bahía Blanca','No apta','Alto'],[5,'Humedal','En evaluación','Sin evaluar']])state.zones.push({...template,id:'z'+i,name,status,risk,activities:template.activities.map(a=>({...a,id:id()}))});}
if(!state.tasks[0].activity)state.tasks[0].activity=state.zones[0].activities[0].id;
let assignmentTemplate=null;let page='',generation=0,trainStep=1;
const app=$('#app'), modal=$('#modal'), mobile=matchMedia('(max-width:767px)');
const me=()=>state.volunteers[0], zone=()=>state.zones.find(z=>z.id===state.selectedZone)||state.zones[0];
const selected=()=>state.volunteers.find(v=>v.id===state.selectedVolunteer)||me();
const selectedTask=()=>state.tasks.find(t=>t.id===state.selectedTask)||state.tasks[0];
const myTask=()=>state.tasks.find(t=>t.id===me().task)||state.tasks[0];
const trained=v=>v.modules.length===3;
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{notice('No se pudo guardar en este navegador.');}}
function notice(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('#toast').hidden=true,4500);}
function go(key){if(location.hash==='#'+key)render();else location.hash=key;}
function requirements(v,t=state.tasks.find(t=>t.id===v.task)){
 const z=t&&state.zones.find(z=>z.id===t.zone),a=z?.activities.find(a=>a.id===t.activity);
 return {registro:v.registered,capacitación:trained(v),asignación:!!t,zona:!!z&&['Apta','Restringida'].includes(z.status)&&!!a?.allowed,experiencia:!!a&&LEVELS.indexOf(v.experience)>=LEVELS.indexOf(a.experience),EPP:!!a&&a.epp.every(e=>v.epp.includes(e))};
}
function ready(v){return Object.values(requirements(v)).every(Boolean);}
const all=(selector,root=app)=>[...root.querySelectorAll(selector)];
function text(element,value){if(element)element.textContent=value;}
function replace(original,value){all('p').filter(p=>p.textContent.trim()===original).forEach(p=>text(p,value));}
function field(label){return all('[data-field]').find(e=>e.dataset.field===label);}
function read(label){return field(label)?.value.trim()||'';}
function setField(label,value){const el=field(label);if(el)el.value=value;}
function bind(el,action){if(!el)return;el.dataset.action=action;el.classList.add('clickable');if(el.tagName!=='BUTTON'&&el.tagName!=='A'){el.setAttribute('role','button');el.tabIndex=0;}el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});}
function caption(label,action){all('[data-name]').filter(e=>e.dataset.name===label&&e.textContent.trim().length<90).forEach(e=>bind(e,action));}
function node(nodeId){return all('[data-node-id]').find(e=>e.dataset.nodeId===nodeId);}
function buttons(label){return all('[data-button]').filter(b=>b.dataset.button===label);}
function labelButton(label,action){buttons(label).forEach(b=>bind(b,action));}
function checkboxFrame(nodeId,label,checked=false){const el=node(nodeId);if(!el)return;bind(el,'toggle-check');el.setAttribute('role','checkbox');el.setAttribute('aria-label',label);el.setAttribute('aria-checked',String(checked));if(checked)el.classList.add('selected-control');return el;}
function openDialog(title,body){modal.innerHTML=`<h2>${safe(title)}</h2>${body}<button data-action="close">Cerrar</button>`;modal.showModal();}
function input(label,name,value=''){return `<label>${safe(label)}<input name="${name}" value="${safe(value)}" required></label>`;}
function manualForm(title,kind,body){openDialog(title,`<form data-kind="${kind}">${body}<p class="runtime-error" role="alert"></p><button type="submit">Guardar</button></form>`);}
function nativeSelect(label,options,value){const old=field(label);if(!old)return;const el=document.createElement('select');for(const [v,t]of options){const o=new Option(t,v,v===value,v===value);el.add(o);}el.className=old.className;el.dataset.field=label;el.setAttribute('aria-label',label);old.replaceWith(el);return el;}
function updateParagraph(prefix,newValue){const p=all('p').find(p=>p.textContent.trim().startsWith(prefix));if(p)text(p,newValue);}
function setupSidebar(){
 const destinations={volunteer:{Inicio:'w02','Mi registro':'w02',Capacitación:'w04','Mi tarea':'w05','Mi código QR':'w06',Alertas:'alerts'},coordinator:{Panel:'w10',Voluntarios:'w11',Tareas:'tasks',EPP:'w14','Ingresos y salidas':'w15',Sincronización:'w16',Zonas:'w07',Alertas:'alerts'},specialist:{Inicio:'w07',Zonas:'w07',Riesgos:'w08',Recomendaciones:'recommendations',Alertas:'alerts'}}[state.role];
 for(const [label,target]of Object.entries(destinations))caption(label,'go:'+target);
 caption('Salir de la demo','go:landing');
 all('[data-name="Rol"],[data-name="Usuario"],[data-name="Cambiar rol"],[data-name="Icono/Intercambiar"]').forEach(el=>bind(el,'go:w01'));
 all('[data-name="Interruptor"],[data-node-id="188:115"]').forEach(el=>bind(el,'offline'));
 all('p').filter(p=>p.textContent.trim()==='Simular sin conexión').forEach(p=>bind(p,'offline'));
}
function setupLanding(){
 labelButton('Probar la demo','go:w01');labelButton('Descargar app','download');labelButton('Descargar para Android','download');
 for(const [label,role] of [['Probar como voluntario','volunteer'],['Probar como especialista','specialist'],['Probar como coordinador','coordinator']])labelButton(label,'role:'+role);
 const anchors={'Inicio':'hero','Para quién':'audience','Cómo funciona':'how','Funcionalidades':'functions','Preguntas':'faq','Preguntas frecuentes':'faq','Modo sin conexión':'offline','Video del producto':'videos','Video del equipo':'videos'};
 all('p').forEach(p=>{const label=p.textContent.trim();if(anchors[label]&&p.children.length===0&&!p.closest('.hero-visual')&&!p.closest('button'))bind(p,'anchor:'+anchors[label]);});
 all('[data-name^="Video ·"],[data-name="Reproducir"]').forEach(el=>bind(el,'video'));
 all('[data-name="Pregunta"]').forEach(el=>bind(el,'faq'));
 all('[data-name="Icono/Menú"]').forEach(el=>bind(el,'mobile-menu'));
}
function setup(){
 setupSidebar();
 labelButton('Volver a la landing','go:landing');labelButton('Entrar como voluntaria','role:volunteer');labelButton('Entrar como especialista','role:specialist');labelButton('Entrar como coordinadora','role:coordinator');
 const maps={w02:{Cancelar:'go:w01',Continuar:'register'},w03:{Atrás:'go:w02','Guardar borrador':'profile-draft','Guardar y continuar':'profile'},w04:{'Paso anterior':'previous-module','Confirmar capacitación':'training'},w05:{'Ver mi código QR':'go:w06','Iniciar tarea':'start'},w07:{'Guardar borrador':'zone-draft','Registrar zona':'zone-save'},w08:{'Comunicar actualización':'go:w09',Añadir:'risk-add','Guardar condiciones':'conditions'},w09:{Cancelar:'go:w08','Publicar actualización':'publish-risk','Guardar condiciones':'conditions'},w10:{Actualizar:'refresh','Escanear QR':'go:w15','Nueva tarea':'go:w12'},w11:{'Asignar a una tarea':'go:w13','Ver sus actividades':'history'},w12:{Cancelar:'go:w10','Crear tarea':'create-task'},w13:{'Asignar (2)':'assign'}, ...window.ecqEPP.BUTTONS, ...window.ecqAccess.BUTTONS};
 for(const [label,action]of Object.entries(maps[page]||{}))labelButton(label,action);
 if(page==='w02'){
  const v=me();for(const [label,key]of [['Nombres y apellidos *','name'],['DNI *','dni'],['Celular *','phone'],['Fecha de nacimiento *','birth'],['Distrito de residencia *','district'],['Correo electrónico (opcional)','email'],['Nombre del contacto *','contact'],['Celular del contacto *','contactPhone']])setField(label,v[key]||'');
  const cp=field('Celular del contacto *');cp?.addEventListener('input',()=>{const good=/^9\d{8}$/.test(cp.value);all('p').filter(p=>['Dato obligatorio pendiente','Falta un dato obligatorio','Completa el celular de tu contacto de emergencia para continuar.'].includes(p.textContent.trim())).forEach(p=>p.hidden=good);});
  const consent=all('p').find(p=>p.textContent.includes('Acepto que mis datos'));if(consent)checkboxFrame(consent.parentElement.dataset.nodeId,'Acepto el uso de los datos',state.consent);
 }
 if(page==='w03'){
  all('[data-name^="Opción ·"],[data-name^="Día "]').forEach(el=>{bind(el,'profile-option');el.dataset.choice=el.textContent.trim();});
  setField('Desde',me().from);setField('Hasta',me().until);
 }
 if(page==='w04'){
  const reviewed=all('p').find(p=>p.textContent.includes('Revisé el contenido obligatorio'));if(reviewed)checkboxFrame(reviewed.parentElement.dataset.nodeId,'Revisé el contenido obligatorio',false);
  ['Riesgos de la zona','Uso correcto del EPP','Rutas de evacuación'].forEach((title,i)=>caption(title,'module:'+i));
  replace('1 de 3 módulos',me().modules.length+' de 3 módulos');
  updateParagraph('Módulo 2 ·','Módulo '+(trainStep+1)+' · '+MODULES[trainStep][0]);
  if(trainStep!==1){replace('Colócate todo tu EPP',MODULES[trainStep][0]);updateParagraph('Revisa que los guantes cubran',MODULES[trainStep][1]);}
 }
 if(page==='w05'){
  const t=myTask();replace('Limpieza de arena · sector norte',t.name);replace('Playa Costa Azul · sector norte',state.zones.find(z=>z.id===t.zone).name);replace('2 de 3 recibidos',me().epp.filter(e=>e<3).length+' de 3 recibidos');
  if(trained(me()))replace('Completada hoy a las 08:20','Completada en la demostración');else replace('Completada hoy a las 08:20','Pendiente de completar');
  const b=buttons('Iniciar tarea')[0];if(b){b.disabled=!ready(me());if(me().status==='En curso'){text(b.querySelector('p'),'Finalizar tarea');b.dataset.action='finish';b.disabled=false;}if(me().status==='Finalizada'){text(b.querySelector('p'),'Tarea finalizada');b.disabled=true;}}
  if(me().epp.includes(2)){replace('Pide tus botas de jebe al coordinador.','EPP obligatorio completo.');replace('Podrás iniciar cuando tengas todo tu EPP.','Revisa los requisitos antes de iniciar.');}
 }
 if(page==='w07'){
  if(state.zoneDraft)for(const [label,value]of Object.entries(state.zoneDraft))setField(label,value);
  const label='Nivel de riesgo *';all('[data-name]').filter(e=>['Bajo','Medio','Alto'].includes(e.textContent.trim())&&e.children.length<3).forEach(el=>bind(el,'zone-risk:'+el.textContent.trim()));
  // La tabla conserva el estilo del diseño; las nuevas zonas se añaden con los mismos componentes.
  all('p').filter(p=>state.zones.some(z=>z.name===p.textContent.trim())).forEach(p=>bind(p,'zone-open:'+state.zones.find(z=>z.name===p.textContent.trim()).id));
 }
 if(page==='w08'||page==='w09'){
  replace('Playa Costa Azul',zone().name);all('[data-name^="Opción ·"]').forEach(el=>bind(el,'equipment-option'));
  nativeSelect('Experiencia requerida',LEVELS.map(v=>[v,v]),zone().activities[0]?.experience||'Sin experiencia');
  all('p').filter(p=>p.textContent.trim()==='Limpieza de arena').forEach(p=>bind(p,'activity-edit'));
  if(page==='w09'){
   all('[data-name]').filter(e=>['Apta','Restringida','No apta','Bajo','Medio','Alto'].includes(e.textContent.trim())&&e.children.length<3).forEach(el=>bind(el,'risk-choice:'+el.textContent.trim()));
   state.draftStatus=zone().status;state.draftRisk=zone().risk;
  }
 }
 if(page==='w11'){
  all('p').filter(p=>state.volunteers.some(v=>v.name.startsWith(p.textContent.trim())&&p.textContent.trim().length>5)).forEach(p=>bind(p,'volunteer:'+state.volunteers.find(v=>v.name.startsWith(p.textContent.trim())).id));
  const search=field('Buscar por nombre o DNI');if(search)search.addEventListener('input',()=>{const q=search.value.toLowerCase();all('[data-name]').filter(el=>state.volunteers.some(v=>el.dataset.name===v.name||v.name.startsWith(el.dataset.name+' '))).forEach(el=>el.hidden=!el.textContent.toLowerCase().includes(q));});
 }
 if(page==='w12'){
  nativeSelect('Zona *',state.zones.map(z=>[z.id,z.name]),state.selectedZone);
  const activities=zone().activities.filter(a=>a.allowed);nativeSelect('Actividad *',activities.map(a=>[a.id,a.name]),activities[0]?.id);
  field('Zona *')?.addEventListener('change',e=>{state.selectedZone=e.target.value;nativeSelect('Actividad *',zone().activities.filter(a=>a.allowed).map(a=>[a.id,a.name]),zone().activities[0]?.id)});
  const count=all('p').find(p=>p.textContent.trim()==='8');if(count){const el=document.createElement('input');el.type='number';el.value=8;el.min=1;el.max=100;el.dataset.field='capacity';el.setAttribute('aria-label','Voluntarios necesarios');el.className=count.className+' figma-input';count.replaceWith(el);}
 }
 if(page==='w13'){
  all('[data-name]').filter(el=>state.volunteers.some(v=>v.name===el.dataset.name||v.name.startsWith(el.dataset.name+' '))).forEach(el=>{if(el.textContent.trim().length<160){const v=state.volunteers.find(v=>v.name===el.dataset.name||v.name.startsWith(el.dataset.name+' '));bind(el,'assign-option:'+v.id);}});
 }
 for(const module of modules) module.setup(page, ctx);
}
async function render(){
 const ticket=++generation;let requested=location.hash.slice(1)||'landing';page=requested;
 if(/^w(07|08|09)$/.test(requested))state.role='specialist';if(/^w(10|11|12|13|14|15|16)$/.test(requested))state.role='coordinator';if(/^w(02|03|04|05|06)$/.test(requested))state.role='volunteer';
 let key=requested==='landing'?(mobile.matches?'landing-mobile':'landing-desktop'):requested;
 if(!/^(landing-(desktop|mobile)|w(0[1-9]|1[0-6]))$/.test(key)){renderExtra(key);return;}
 try{const response=await fetch('pages/'+key+'.html');if(!response.ok)throw new Error('No se encuentra la pantalla '+key);const html=await response.text();if(ticket!==generation)return;app.innerHTML=(requested==='landing'?'':'<div class="page-root">')+html+(requested==='landing'?'':'</div>');if(requested==='landing'){setupLanding();scaleLanding();}else {setup();setupLive();}document.title='EcoCuadrilla · '+(requested==='landing'?'Inicio':requested.toUpperCase());window.scrollTo(0,0);}catch(error){app.innerHTML='<p style="padding:32px">'+safe(error.message)+'. Abre el proyecto con un servidor local (py -m http.server 5500).</p>';}
}
function renderExtra(key){
 // Vistas de datos complementarias: reutilizan la carcasa y los componentes del diseño.
 const base=state.role==='coordinator'?'w10':state.role==='specialist'?'w07':'w05';
 fetch('pages/'+base+'.html').then(r=>r.text()).then(html=>{app.innerHTML='<div class="page-root">'+html+'</div>';setupSidebar();let area=all('[data-name="Contenido"]').find(el=>el.children.length>1)||app.lastElementChild.lastElementChild.lastElementChild;const panel=document.createElement('section');panel.className='runtime-panel';
 if(key==='alerts'){panel.innerHTML='<h1>Alertas</h1>'+state.alerts.slice().reverse().map(a=>`<article><h2>${safe(a.title)}</h2><p>${safe(a.message)}</p><small>${new Date(a.date).toLocaleString('es-PE')}</small><button data-action="go:w08">Ver zona</button></article>`).join('');if(!state.alerts.length)panel.innerHTML+='<p>No hay alertas nuevas.</p>';}
 if(key==='tasks'){panel.innerHTML='<h1>Tareas</h1><button data-action="go:w12">Nueva tarea</button>'+state.tasks.map(t=>`<article><h2>${safe(t.name)}</h2><p>${safe(state.zones.find(z=>z.id===t.zone).name)} · ${safe(t.start)} – ${safe(t.end)}</p><p>${safe(t.instructions)}</p><button data-action="task-open:${t.id}">Asignar voluntarios</button></article>`).join('');}
 if(key==='recommendations'){panel.innerHTML='<h1>Recomendaciones de seguridad</h1>'+state.zones.map(z=>`<article><h2>${safe(z.name)}</h2><p>${safe(z.recommendation)}</p><button data-action="recommendation:${z.id}">Editar recomendación</button></article>`).join('');}
 area.replaceChildren(panel);});
}
function assignable(v,t){const r=requirements(v,t);return r.registro&&r.capacitación&&r.zona&&r.experiencia&&v.status!=='En curso';}
function valueRequired(labels){for(const l of labels)if(!read(l)){notice('Completa el campo '+l);field(l)?.focus();return false;}return true;}
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-action]');if(!el)return;const [action,param]=el.dataset.action.split(':');
 if(action==='go'){go(param);return;}
 if(action==='close'){modal.close();return;}
 if(action==='role'){state.role=param;save();go(param==='coordinator'?'w10':param==='specialist'?'w07':'w02');return;}
 for(const module of modules){
  const result=module.handle(action,param,el,ctx);
  if(result==='render'){save();render();return;}
  if(result)return;
 }
 switch(action){
 case 'anchor':{const suffix=mobile.matches?'':'-desktop';document.getElementById(mobile.matches?'m-'+param:param+suffix)?.scrollIntoView();return;}
 case 'download':notice('El equipo aún no ha añadido un APK publicado.');return;
 case 'video':notice('El equipo aún no ha añadido el enlace del video.');return;
 case 'mobile-menu':openDialog('EcoCuadrilla','<p><a href="#w01">Probar la demo</a></p><p>Para quién · Cómo funciona · Funcionalidades · Preguntas</p>');return;
 case 'faq':{const parent=el.parentElement;const answer=parent.querySelector('[data-answer]');if(answer){answer.hidden=!answer.hidden;return;}const p=document.createElement('p');p.dataset.answer='true';p.style.cssText='padding:12px 0;font:16px/24px Inter';p.textContent='Consulta las indicaciones de tu zona y del coordinador. La capacitación y el EPP obligatorio se verifican antes de iniciar la tarea.';parent.append(p);return;}
 case 'toggle-check':el.setAttribute('aria-checked',el.getAttribute('aria-checked')!=='true');el.classList.toggle('selected-control');if(page==='w02')state.consent=el.getAttribute('aria-checked')==='true';return;
 case 'register':{
  if(!valueRequired(['Nombres y apellidos *','DNI *','Celular *','Fecha de nacimiento *','Distrito de residencia *','Nombre del contacto *','Celular del contacto *']))return;
  if(!state.consent){notice('Acepta el uso de los datos para continuar.');return;}
  if(!/^\d{8}$/.test(read('DNI *'))){notice('El DNI debe tener ocho dígitos.');return;}
  if(!/^9\d{8}$/.test(read('Celular *').replace(/\s/g,''))||!/^9\d{8}$/.test(read('Celular del contacto *').replace(/\s/g,''))){notice('Introduce celulares de nueve dígitos.');return;}
  for(const [label,key]of [['Nombres y apellidos *','name'],['DNI *','dni'],['Celular *','phone'],['Fecha de nacimiento *','birth'],['Distrito de residencia *','district'],['Correo electrónico (opcional)','email'],['Nombre del contacto *','contact'],['Celular del contacto *','contactPhone']])me()[key]=read(label);save();go('w03');return;
 }
 case 'profile-option':el.classList.toggle('selected-control');el.dataset.chosen=el.classList.contains('selected-control');if(el.dataset.name.includes('No tengo experiencia'))me().experience='Sin experiencia';if(el.dataset.name.includes('Tengo experiencia'))me().experience='Básica';return;
 case 'profile-draft':case 'profile':{
  if(read('Hasta')<=read('Desde')){notice('El horario de fin debe ser posterior al inicio.');return;}
  me().days=all('[data-name^="Día "].selected-control').map(e=>e.dataset.day||e.textContent.trim());me().from=read('Desde');me().until=read('Hasta');const choices=all('[data-name^="Opción ·"]').filter(e=>e.dataset.chosen==='true').map(e=>e.dataset.name.replace('Opción · ',''));if(choices.length)me().skills=choices.filter(c=>!['Tengo experiencia','No tengo experiencia'].includes(c));if(action==='profile')me().registered=true;save();if(action==='profile')go('w04');else notice('Borrador guardado.');return;
 }
 case 'module':trainStep=Number(param);render();return;
 case 'previous-module':trainStep=Math.max(0,trainStep-1);render();return;
 case 'training':{const box=all('[role="checkbox"]').find(e=>e.getAttribute('aria-label')==='Revisé el contenido obligatorio');if(box?.getAttribute('aria-checked')!=='true'){notice('Confirma que revisaste el contenido.');return;}if(!me().modules.includes(trainStep))me().modules.push(trainStep);trainStep=[0,1,2].find(i=>!me().modules.includes(i))??2;if(me().modules.length<3){trainStep=[0,1,2].find(i=>!me().modules.includes(i));notice('Módulo confirmado. Continúa con el siguiente.');render();}else{notice('Capacitación completada.');go('w05');}save();return;}
 case 'start':if(!ready(me())){notice('Completa los requisitos antes de iniciar.');return;}me().status='En curso';notice('Tarea iniciada.');break;
 case 'finish':me().status='Finalizada';notice('Tarea finalizada.');break;
 case 'zone-risk':state.draftRisk=param;all('[data-action^="zone-risk:"]').forEach(x=>x.classList.toggle('selected-control',x===el));return;
 case 'zone-draft':state.zoneDraft=Object.fromEntries(all('[data-field]').map(e=>[e.dataset.field,e.value]));save();notice('Borrador local guardado.');return;
 case 'zone-save':{
  if(!valueRequired(['Nombre de la zona *','Ubicación *']))return;
  const z={id:id(),name:read('Nombre de la zona *'),location:read('Ubicación *'),description:read('Descripción breve')||read('Descripción breve *'),risk:state.draftRisk||'Alto',status:'En evaluación',risks:[],recommendation:'Pendiente de recomendación.',activities:[]};state.zones.push(z);delete state.zoneDraft;state.selectedZone=z.id;save();notice('Zona registrada.');go('w08');return;
 }
 case 'zone-open':state.selectedZone=param;save();go('w08');return;
 case 'risk-add':manualForm('Añadir riesgo','risk',input('Riesgo e indicación','text'));return;
 case 'equipment-option':el.classList.toggle('selected-control');el.dataset.chosen=el.classList.contains('selected-control');return;
 case 'activity-edit':manualForm('Actividad permitida','activity',input('Nombre de actividad','name',zone().activities[0]?.name||'')+'<label><input type="checkbox" name="allowed" checked>Permitida</label>');return;
 case 'conditions':{
  let a=zone().activities[0];if(!a){a={id:id(),name:'Limpieza de arena',allowed:true,experience:'Sin experiencia',epp:[0,1,2]};zone().activities.push(a);}a.experience=read('Experiencia requerida')||'Sin experiencia';const chosen=all('[data-name^="Opción ·"]').filter(e=>e.dataset.chosen==='true').map(e=>EPP.indexOf(e.dataset.name.replace('Opción · ',''))).filter(i=>i>=0);if(chosen.length)a.epp=chosen;save();notice('Condiciones guardadas.');return;
 }
 case 'risk-choice':if(['Bajo','Medio','Alto'].includes(param))state.draftRisk=param;else state.draftStatus=param;el.classList.toggle('selected-control');return;
 case 'publish-risk':{
  const reason=read('¿Qué cambió? *');if(!reason){notice('Escribe el motivo del cambio.');return;}zone().status=state.draftStatus||zone().status;zone().risk=state.draftRisk||zone().risk;state.alerts.push({id:id(),title:'Actualización de '+zone().name,message:reason,zone:zone().id,date:new Date().toISOString()});if(zone().status==='No apta')state.volunteers.filter(v=>state.tasks.find(t=>t.id===v.task)?.zone===zone().id&&v.status==='En curso').forEach(v=>v.status='Interrumpida');save();notice('Cambio comunicado.');go('w08');return;
 }
 case 'refresh':notice('Datos locales actualizados.');break;
 case 'volunteer':state.selectedVolunteer=param;replace('María Quispe Rojas',selected().name);replace('74652318',selected().dni);setupLive();return;
 case 'history':openDialog('Actividades del voluntario','<p>'+safe(selected().name)+'</p><p>'+safe(state.tasks.find(t=>t.id===selected().task)?.name||'Sin tarea asignada')+'</p>');return;
 case 'create-task':{
  if(!valueRequired(['Nombre de la tarea *','Actividad *','Zona *','Horario *']))return;const z=zone(),a=z.activities.find(a=>a.id===read('Actividad *'));if(!['Apta','Restringida'].includes(z.status)||!a?.allowed){notice('La zona o actividad no está habilitada.');return;}
  const times=read('Horario *').split(/[–-]/).map(v=>v.trim());if(times.length!==2||times[1]<=times[0]){notice('Indica un horario válido, por ejemplo 09:30 – 12:30.');return;}
  const t={id:id(),name:read('Nombre de la tarea *'),zone:z.id,activity:a.id,date:read('Fecha *'),start:times[0],end:times[1],capacity:Number(read('capacity')||8),instructions:read('Instrucciones para los voluntarios')};if(t.capacity<1){notice('Indica la capacidad de la tarea.');return;}state.tasks.push(t);state.selectedTask=t.id;save();notice('Tarea creada.');go('w13');return;
 }
 case 'task-open':state.selectedTask=param;save();go('w13');return;
 case 'assign-option':{const v=state.volunteers.find(v=>v.id===param);if(!assignable(v,selectedTask())){notice('El voluntario no cumple los requisitos.');return;}el.classList.toggle('selected-control');el.dataset.assign=el.classList.contains('selected-control')?v.id:'';updateAssignment();return;}
 case 'assign':{const ids=all('[data-assign]').map(e=>e.dataset.assign).filter(Boolean);if(!ids.length){notice('Selecciona al menos un voluntario compatible.');return;}if(ids.length>selectedTask().capacity){notice('La selección supera la capacidad.');return;}ids.forEach(vId=>{const v=state.volunteers.find(v=>v.id===vId);v.task=selectedTask().id;v.status='Asignada';});save();notice('Asignación registrada.');go('w10');return;}
 case 'recommendation':state.selectedZone=param;manualForm('Recomendación de seguridad','recommendation',input('Indicación','text',zone().recommendation));return;
 }
 save();render();
});
modal.addEventListener('submit',event=>{event.preventDefault();const form=event.target;if(!form.reportValidity())return;const f=new FormData(form),text=String(f.get('text')||'').trim();if(form.dataset.kind==='risk')zone().risks.push(text);if(form.dataset.kind==='recommendation')zone().recommendation=text;if(form.dataset.kind==='activity'){const a=zone().activities[0];if(a){a.name=String(f.get('name'));a.allowed=f.has('allowed');}else zone().activities.push({id:id(),name:String(f.get('name')),allowed:f.has('allowed'),experience:'Sin experiencia',epp:[0,1,2]});}save();modal.close();render();notice('Cambios guardados.');});
const ctx = {
  state, save, notice, render, openDialog, safe, EPP, modal,
  all, text, replace, read, setField, bind, caption, nativeSelect,
  selected, me, zone, requirements, ready, id
};
const modules = [window.ecqEPP, window.ecqAccess];
window.addEventListener('hashchange',render);mobile.addEventListener('change',()=>{if(page==='landing')render();});render();

function scaleLanding(){const frame=app.querySelector('.landing-frame');if(frame){const designWidth=mobile.matches?360:1440;frame.style.width=designWidth+'px';frame.style.maxWidth='none';frame.style.zoom=document.documentElement.clientWidth/designWidth;}}
window.addEventListener('resize',()=>{if(page==='landing')scaleLanding();});

// Vincula los datos a las filas y tarjetas originales, sin cambiar su composición.
function setupLive(){
 const named=n=>all('[data-name]').find(e=>e.dataset.name===n);
 const setValue=(n,v)=>{const c=named(n);if(c){const ps=all('p',c);text(ps[ps.length-1],v);}};
 const cloneRows=(container,rows,values)=>{if(!container||!rows.length)return;const template=rows[0].cloneNode(true);rows.forEach(r=>r.remove());for(const val of values){const row=template.cloneNode(true);val(row);container.append(row);}};
 if(page==='w03'){
  const dayNames=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];all('[data-name^="Día "]').forEach((e,i)=>{e.dataset.day=dayNames[i];e.classList.toggle('selected-control',me().days.includes(dayNames[i]));});
 }
 if(page==='w04'){
  ['Riesgos de la zona','Uso correcto del EPP','Rutas de evacuación'].forEach((n,i)=>{const e=named(n);if(e){const ps=all('p',e);text(ps[ps.length-1],me().modules.includes(i)?'Completado':i===trainStep?'En curso':'Pendiente');}});
 }
 if(page==='w07'){
  const table=named('Zonas registradas'),rows=table?[...table.children].filter(e=>state.zones.some(z=>z.name===e.dataset.name)):[];
  cloneRows(table,rows,state.zones.map(z=>row=>{row.dataset.name=z.name;const ps=all('p',row);[z.name,z.risk,z.status,'Hoy'].forEach((v,i)=>text(ps[i],v));bind(row,'zone-open:'+z.id);}));
  replace('5 zonas',state.zones.length+' zonas');
 }
 if(page==='w08'||page==='w09'){
  setValue('Nivel de riesgo',zone().risk);setValue('Estado de la zona',zone().status);
  const box=named('Riesgos identificados');if(box){const rows=[...box.children].slice(1);cloneRows(box,rows,zone().risks.map(r=>row=>{const ps=all('p',row);text(ps[0],r.split(':')[0]);text(ps[1],r.includes(':')?r.split(':').slice(1).join(':'):'Indicación del especialista');text(ps[2],zone().risk);}));}
  all('[data-name^="Opción ·"]').forEach(e=>{const index=EPP.indexOf(e.dataset.name.replace('Opción · ',''));if(index>=0){const chosen=zone().activities[0]?.epp.includes(index);e.dataset.chosen=String(!!chosen);e.classList.toggle('selected-control',!!chosen);}});
 }
 if(page==='w11'){
  const profile=named('Perfil del voluntario');if(profile){const v=selected();for(const [n,value]of [['DNI',v.dni],['Celular',v.phone],['Contacto de emergencia',v.contact+' · '+v.contactPhone],['Disponibilidad',v.days.join(', ')+' · '+v.from+' – '+v.until]]){const c=all('[data-name]',profile).find(e=>e.dataset.name===n);if(c)text(all('p',c).at(-1),value);}}
  const search=field('Buscar voluntario')||field('Buscar por nombre o DNI');search?.addEventListener('input',()=>{const q=search.value.toLowerCase();all('[data-name]',named('Tabla de voluntarios')||app).filter(e=>state.volunteers.some(v=>v.name.startsWith(e.dataset.name))).forEach(e=>e.hidden=!e.textContent.toLowerCase().includes(q));});
 }
 if(page==='w13'){
  const candidates=named('Candidatos'),chosen=named('Seleccionados');replace('Limpieza de arena · sector norte',selectedTask().name);
  if(candidates)for(const row of [...candidates.children].slice(1)){const v=state.volunteers.find(v=>v.name.startsWith(row.dataset.name));if(!v)continue;bind(row,'assign-option:'+v.id);row.dataset.assign='';row.classList.remove('selected-control');const icon=row.children[0];if(icon?.dataset.name==='Icono')icon.style.visibility='hidden';}
  if(chosen){assignmentTemplate=[...chosen.children].find(e=>state.volunteers.some(v=>v.name.startsWith(e.dataset.name)))?.cloneNode(true);for(const row of [...chosen.children].filter(e=>state.volunteers.some(v=>v.name.startsWith(e.dataset.name))))row.remove();}
  updateAssignment();
 }
 if(page==='w05'){
  const t=myTask(),z=state.zones.find(z=>z.id===t.zone),a=z.activities.find(a=>a.id===t.activity),r=requirements(me());
  replace('EPP · 2 de 3 recibidos','EPP · '+me().epp.filter(e=>a.epp.includes(e)).length+' de '+a.epp.length+' recibidos');
  replace('2 de 3 cumplidos',[r.capacitación,r.experiencia,r.EPP].filter(Boolean).length+' de 3 cumplidos');
  replace('Restringida',z.status);
  const riskBox=named('Riesgos de mi zona');if(riskBox){const rows=[...riskBox.children].slice(1);cloneRows(riskBox,rows,z.risks.map(r=>row=>{const ps=all('p',row);text(ps[0],r.split(':')[0]);text(ps[1],r.split(':').slice(1).join(':')||z.recommendation);text(ps[2],z.risk);}));}
 }
 for(const module of modules) module.live(page, ctx);
}
function updateAssignment(){
 const ids=all('[data-assign]').map(e=>e.dataset.assign).filter(Boolean);
 const b=buttons('Asignar (2)')[0];if(b)text(b.querySelector('p'),'Asignar ('+ids.length+')');
 const box=all('[data-name="Seleccionados"]')[0];if(box){const p=all('p',box).find(p=>p.textContent.startsWith('Seleccionados'));if(p)text(p,'Seleccionados ('+ids.length+')');all('p',box).filter(p=>p.textContent.startsWith('Faltan')).forEach(p=>text(p,'Faltan '+Math.max(0,selectedTask().capacity-ids.length)+' voluntarios para completar la tarea.'));for(const row of [...box.children].filter(e=>e.dataset.selectedRow))row.remove();if(assignmentTemplate)for(const vId of ids){const v=state.volunteers.find(v=>v.id===vId),row=assignmentTemplate.cloneNode(true);row.dataset.selectedRow=vId;row.dataset.name=v.name;const ps=all('p',row);text(ps[0],v.name.split(' ').map(n=>n[0]).slice(0,2).join(''));text(ps[1],v.name);box.append(row);}}
}
