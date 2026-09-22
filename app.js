const items=[
 {name:'Auto',img:'auto.png'}, {name:'Hut',img:'hut.png'}, {name:'Lupe',img:'lupe.png'},
 {name:'Schlüssel',img:'schluessel.png'}, {name:'Kompass',img:'kompass.png'}
];
const viewport=document.querySelector('#viewport'),world=document.querySelector('#world'),targets=document.querySelector('#targets'),toast=document.querySelector('#toast');
let found=new Set(),lives=3,scale=1,tx=0,ty=0,pointers=new Map(),startDist=0,startScale=1,startMid=null,startTransform=null,moved=false;
function render(){targets.innerHTML=items.map((o,i)=>`<div class="target ${found.has(i)?'done':''}"><img src="${o.img}" alt=""><small>${o.name}</small></div>`).join('');document.querySelector('#score').textContent=`${found.size}/${items.length}`;document.querySelector('#lives').textContent=`❤️ ${lives}`;document.querySelectorAll('.hotspot').forEach((h,i)=>h.classList.toggle('found',found.has(i)))}
let mt;function msg(t){clearTimeout(mt);toast.textContent=t;toast.classList.add('show');mt=setTimeout(()=>toast.classList.remove('show'),1000)}
function apply(){const r=viewport.getBoundingClientRect(),wr=world.offsetWidth*scale,hr=world.offsetHeight*scale;tx=Math.min(0,Math.max(r.width-wr,tx));ty=Math.min(0,Math.max(r.height-hr,ty));world.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`}
function resetView(){scale=1;tx=0;ty=0;apply()}
document.querySelectorAll('.hotspot').forEach(h=>h.addEventListener('click',e=>{if(moved){e.preventDefault();return}const i=+h.dataset.id;if(found.has(i))return;found.add(i);msg(`✓ ${items[i].name} gefunden`);render();if(found.size===items.length)setTimeout(()=>msg('🎉 Level geschafft!'),300)}));
viewport.addEventListener('pointerdown',e=>{viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY});moved=false;if(pointers.size===2){const a=[...pointers.values()];startDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);startScale=scale;startMid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};startTransform={tx,ty}}});
viewport.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;const old={x:p.x,y:p.y};p.x=e.clientX;p.y=e.clientY;if(Math.hypot(p.x-p.ox,p.y-p.oy)>7)moved=true;if(pointers.size===1&&scale>1){tx+=p.x-old.x;ty+=p.y-old.y;apply()}else if(pointers.size===2){moved=true;const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),ns=Math.max(1,Math.min(3.5,startScale*d/startDist));const vr=viewport.getBoundingClientRect(),mx=startMid.x-vr.left,my=startMid.y-vr.top;tx=mx-(mx-startTransform.tx)*(ns/startScale);ty=my-(my-startTransform.ty)*(ns/startScale);scale=ns;apply()}});
['pointerup','pointercancel'].forEach(ev=>viewport.addEventListener(ev,e=>{pointers.delete(e.pointerId);if(pointers.size===0)setTimeout(()=>moved=false,0)}));
viewport.addEventListener('dblclick',e=>{const r=viewport.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,ns=scale>1?1:2;if(ns===1){scale=1;tx=ty=0}else{tx=mx-(mx-tx)*(ns/scale);ty=my-(my-ty)*(ns/scale);scale=ns}apply()});
document.querySelector('#hint').onclick=()=>{const i=items.findIndex((_,i)=>!found.has(i));if(i<0)return;const h=document.querySelector(`.hotspot[data-id="${i}"]`);h.classList.add('hint-ring');setTimeout(()=>h.classList.remove('hint-ring'),1900);msg(`💡 ${items[i].name}`)};
document.querySelector('#reset').onclick=()=>{found.clear();lives=3;resetView();render();msg('Neu gestartet')};
render();addEventListener('resize',apply);if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
