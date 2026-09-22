const items=[
 {name:'Auto',img:'auto.png'},
 {name:'Hut',img:'hut.png'},
 {name:'Lupe',img:'lupe.png'},
 {name:'Schlüssel',img:'schluessel.png'},
 {name:'Kompass',img:'kompass.png'}
];

const viewport=document.querySelector('#viewport');
const world=document.querySelector('#world');
const targets=document.querySelector('#targets');
const toast=document.querySelector('#toast');
const sparkLayer=document.querySelector('#spark-layer');
let found=new Set(),lives=3,scale=1,tx=0,ty=0,pointers=new Map(),startDist=0,startScale=1,startMid=null,startTransform=null,moved=false,animating=new Set();

function render(){
  targets.innerHTML=items.map((o,i)=>`
    <div class="target ${found.has(i)?'done':''}" data-target-id="${i}">
      <div class="target-pic"><img src="${o.img}" alt="${o.name}">${found.has(i)?'<span class="check">✓</span>':''}</div>
      <small>${o.name}</small>
    </div>`).join('');
  document.querySelector('#score').textContent=`${found.size}/${items.length}`;
  document.querySelector('#lives').textContent=`❤️ ${lives}`;
  document.querySelectorAll('.hotspot').forEach((h,i)=>h.classList.toggle('found',found.has(i)));
  document.querySelectorAll('.clean-patch').forEach((p,i)=>p.classList.toggle('visible',found.has(i)));
}

let mt;
function msg(t,duration=1100){
  clearTimeout(mt);toast.textContent=t;toast.classList.add('show');
  mt=setTimeout(()=>toast.classList.remove('show'),duration);
}

function apply(){
  const r=viewport.getBoundingClientRect(),wr=world.offsetWidth*scale,hr=world.offsetHeight*scale;
  tx=Math.min(0,Math.max(r.width-wr,tx));
  ty=Math.min(0,Math.max(r.height-hr,ty));
  world.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
}
function resetView(){scale=1;tx=0;ty=0;apply()}

function burst(x,y){
  for(let n=0;n<12;n++){
    const s=document.createElement('i');
    const a=(Math.PI*2*n/12)+(Math.random()*.25);
    const dist=28+Math.random()*38;
    s.className='spark';
    s.style.left=`${x}px`;s.style.top=`${y}px`;
    s.style.setProperty('--dx',`${Math.cos(a)*dist}px`);
    s.style.setProperty('--dy',`${Math.sin(a)*dist}px`);
    sparkLayer.appendChild(s);
    setTimeout(()=>s.remove(),720);
  }
}

async function collectItem(i,hotspot){
  if(found.has(i)||animating.has(i))return;
  animating.add(i);

  const from=hotspot.getBoundingClientRect();
  const target=document.querySelector(`[data-target-id="${i}"] .target-pic img`);
  const to=target.getBoundingClientRect();
  const cx=from.left+from.width/2,cy=from.top+from.height/2;
  burst(cx,cy);

  hotspot.classList.add('collecting');
  const flyer=document.createElement('img');
  flyer.className='fly-item';
  flyer.src=items[i].img;
  flyer.alt='';
  Object.assign(flyer.style,{left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`});
  document.body.appendChild(flyer);

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    flyer.classList.add('flying');
    Object.assign(flyer.style,{left:`${to.left}px`,top:`${to.top}px`,width:`${to.width}px`,height:`${to.height}px`});
  }));

  setTimeout(()=>document.querySelector(`.clean-patch[data-id="${i}"]`).classList.add('visible'),170);

  await new Promise(r=>setTimeout(r,680));
  flyer.remove();
  found.add(i);
  animating.delete(i);
  render();
  const card=document.querySelector(`[data-target-id="${i}"]`);
  card.classList.add('landed');
  setTimeout(()=>card?.classList.remove('landed'),550);
  msg(`✓ ${items[i].name} gefunden`);
  if(found.size===items.length)setTimeout(()=>msg('🎉 Level geschafft!',1800),650);
}

document.querySelectorAll('.hotspot').forEach(h=>h.addEventListener('click',e=>{
  if(moved){e.preventDefault();return}
  collectItem(+h.dataset.id,h);
}));

viewport.addEventListener('pointerdown',e=>{
  viewport.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY});
  moved=false;
  if(pointers.size===2){
    const a=[...pointers.values()];
    startDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    startScale=scale;
    startMid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
    startTransform={tx,ty};
  }
});
viewport.addEventListener('pointermove',e=>{
  const p=pointers.get(e.pointerId);if(!p)return;
  const old={x:p.x,y:p.y};p.x=e.clientX;p.y=e.clientY;
  if(Math.hypot(p.x-p.ox,p.y-p.oy)>7)moved=true;
  if(pointers.size===1&&scale>1){tx+=p.x-old.x;ty+=p.y-old.y;apply()}
  else if(pointers.size===2){
    moved=true;
    const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),ns=Math.max(1,Math.min(3.5,startScale*d/startDist));
    const vr=viewport.getBoundingClientRect(),mx=startMid.x-vr.left,my=startMid.y-vr.top;
    tx=mx-(mx-startTransform.tx)*(ns/startScale);ty=my-(my-startTransform.ty)*(ns/startScale);scale=ns;apply();
  }
});
['pointerup','pointercancel'].forEach(ev=>viewport.addEventListener(ev,e=>{pointers.delete(e.pointerId);if(pointers.size===0)setTimeout(()=>moved=false,0)}));
viewport.addEventListener('dblclick',e=>{
  const r=viewport.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,ns=scale>1?1:2;
  if(ns===1){scale=1;tx=ty=0}else{tx=mx-(mx-tx)*(ns/scale);ty=my-(my-ty)*(ns/scale);scale=ns}
  apply();
});

document.querySelector('#hint').onclick=()=>{
  const i=items.findIndex((_,i)=>!found.has(i)&&!animating.has(i));if(i<0)return;
  const h=document.querySelector(`.hotspot[data-id="${i}"]`);
  h.classList.add('hint-ring');setTimeout(()=>h.classList.remove('hint-ring'),1900);msg(`💡 ${items[i].name}`);
};
document.querySelector('#reset').onclick=()=>{
  found.clear();animating.clear();lives=3;resetView();render();
  document.querySelectorAll('.clean-patch').forEach(p=>p.classList.remove('visible'));
  document.querySelectorAll('.hotspot').forEach(h=>h.classList.remove('collecting'));
  document.querySelectorAll('.fly-item').forEach(f=>f.remove());
  msg('Neu gestartet');
};

render();
addEventListener('resize',apply);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
