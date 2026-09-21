const items=[
{name:'Auto',icon:'🚗',x:.527,y:.493,r:.055},
{name:'Hut',icon:'👒',x:.865,y:.075,r:.07},
{name:'Lupe',icon:'🔎',x:.293,y:.535,r:.055},
{name:'Schmetterling',icon:'🦋',x:.955,y:.31,r:.055},
{name:'Schlüssel',icon:'🔑',x:.466,y:.576,r:.055}
];
let found=new Set(),lives=3; const scene=document.querySelector('#scene'), targets=document.querySelector('#targets'),toast=document.querySelector('#toast');
function render(){targets.innerHTML=items.map((o,i)=>`<div class="target ${found.has(i)?'done':''}"><span>${o.icon}</span><small>${o.name}</small></div>`).join('');document.querySelector('#score').textContent=`${found.size}/${items.length}`;document.querySelector('#lives').textContent=`❤️ ${lives}`}
function msg(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),900)}
scene.addEventListener('click',e=>{const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;let hit=-1,best=9;items.forEach((o,i)=>{if(found.has(i))return;let d=Math.hypot(x-o.x,y-o.y);if(d<o.r&&d<best){best=d;hit=i}});if(hit>=0){found.add(hit);msg(`✓ ${items[hit].name} gefunden`);render();if(found.size===items.length)setTimeout(()=>msg('🎉 Level geschafft!'),250)}else{lives=Math.max(0,lives-1);msg('Nicht gesucht');render();if(!lives)setTimeout(()=>{found.clear();lives=3;render();msg('Neuer Versuch')},700)}});
document.querySelector('#hint').onclick=()=>{const i=items.findIndex((_,i)=>!found.has(i));if(i<0)return;msg(`💡 Suche: ${items[i].name} – ${items[i].x<.5?'links':'rechts'} im Bild`)};
document.querySelector('#reset').onclick=()=>{found.clear();lives=3;render();msg('Neu gestartet')};render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
