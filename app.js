const items=[
  {img:'laterne.png'},
  {img:'stiefel.png'},
  {img:'taschenuhr.png'},
  {img:'schluessel.png'},
  {img:'fernglas.png'}
];

const viewport=document.querySelector('#viewport');
const world=document.querySelector('#world');
const targets=document.querySelector('#targets');
const toast=document.querySelector('#toast');
const sparkLayer=document.querySelector('#spark-layer');

let found=new Set();
let lives=3;
let scale=1,tx=0,ty=0,fitScale=1;
let pointers=new Map();
let startDist=0,startScale=1,startMid=null,startTransform=null;
let moved=false;
let animating=new Set();

function render(){
  targets.innerHTML=items.map((o,i)=>`<div class="target ${found.has(i)?'done':''}" data-target-id="${i}"><img src="${o.img}" alt="Suchobjekt">${found.has(i)?'<span class="check">✓</span>':''}</div>`).join('');
  document.querySelector('#score').textContent=`${found.size}/${items.length}`;
  document.querySelector('#lives').textContent=`❤️ ${lives}`;
  document.querySelectorAll('.object').forEach((o)=>o.classList.toggle('gone',found.has(+o.dataset.id)));
}

let mt;
function msg(t,d=1000){clearTimeout(mt);toast.textContent=t;toast.classList.add('show');mt=setTimeout(()=>toast.classList.remove('show'),d)}

function clamp(){
  const r=viewport.getBoundingClientRect();
  const wr=world.offsetWidth*scale,hr=world.offsetHeight*scale;
  tx=wr<=r.width?(r.width-wr)/2:Math.min(0,Math.max(r.width-wr,tx));
  ty=hr<=r.height?(r.height-hr)/2:Math.min(0,Math.max(r.height-hr,ty));
}
function apply(){clamp();world.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`}
function resetView(){
  requestAnimationFrame(()=>{
    const vw=viewport.clientWidth, vh=viewport.clientHeight;
    const ww=world.offsetWidth, wh=world.offsetHeight;
    fitScale=Math.min(vw/ww, vh/wh);
    scale=fitScale;
    tx=(vw-ww*scale)/2;
    ty=(vh-wh*scale)/2;
    apply();
  });
}

function burst(x,y){
  for(let n=0;n<12;n++){
    const s=document.createElement('i');
    const a=Math.PI*2*n/12,dist=30+Math.random()*36;
    s.className='spark';s.style.left=x+'px';s.style.top=y+'px';
    s.style.setProperty('--dx',Math.cos(a)*dist+'px');s.style.setProperty('--dy',Math.sin(a)*dist+'px');
    sparkLayer.appendChild(s);setTimeout(()=>s.remove(),720);
  }
}

async function collect(i,obj){
  if(found.has(i)||animating.has(i))return;
  animating.add(i);
  const from=obj.getBoundingClientRect();
  const targetImg=document.querySelector(`[data-target-id="${i}"] img`);
  const to=targetImg.getBoundingClientRect();
  burst(from.left+from.width/2,from.top+from.height/2);

  const flyer=document.createElement('img');
  flyer.className='fly-item';flyer.src=items[i].img;
  Object.assign(flyer.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
  document.body.appendChild(flyer);
  obj.classList.add('collecting');

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    flyer.classList.add('flying');
    Object.assign(flyer.style,{left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'});
  }));

  await new Promise(r=>setTimeout(r,680));
  flyer.remove();
  found.add(i);animating.delete(i);render();
  const card=document.querySelector(`[data-target-id="${i}"]`);
  card.classList.add('landed');setTimeout(()=>card?.classList.remove('landed'),550);
  msg('✓ Gefunden');
  if(found.size===items.length)setTimeout(()=>msg('🎉 Level geschafft!',1800),650);
}

document.querySelectorAll('.object').forEach(o=>o.addEventListener('click',e=>{
  if(moved){e.preventDefault();return}
  collect(+o.dataset.id,o);
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

  if(pointers.size===1){
    const r=viewport.getBoundingClientRect();
    const canPan=world.offsetWidth*scale>r.width+1||world.offsetHeight*scale>r.height+1;
    if(canPan){tx+=p.x-old.x;ty+=p.y-old.y;apply()}
  }else if(pointers.size===2){
    moved=true;
    const a=[...pointers.values()];
    const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    const ns=Math.max(fitScale,Math.min(fitScale*3.5,startScale*d/startDist));
    const vr=viewport.getBoundingClientRect();
    const mx=startMid.x-vr.left,my=startMid.y-vr.top;
    tx=mx-(mx-startTransform.tx)*(ns/startScale);
    ty=my-(my-startTransform.ty)*(ns/startScale);
    scale=ns;apply();
  }
});

['pointerup','pointercancel'].forEach(ev=>viewport.addEventListener(ev,e=>{
  pointers.delete(e.pointerId);
  if(!pointers.size)setTimeout(()=>moved=false,0);
}));

document.querySelector('#hint').onclick=()=>{
  const i=items.findIndex((_,i)=>!found.has(i)&&!animating.has(i));
  if(i<0)return;
  const o=document.querySelector(`.object[data-id="${i}"]`);
  o.classList.add('hint-ring');setTimeout(()=>o.classList.remove('hint-ring'),1900);
  msg('💡 Schau genau hin');
};

document.querySelector('#reset').onclick=()=>{
  found.clear();animating.clear();lives=3;
  document.querySelectorAll('.object').forEach(o=>o.classList.remove('collecting','gone'));
  document.querySelectorAll('.fly-item').forEach(f=>f.remove());
  render();resetView();msg('Neu gestartet');
};

render();
addEventListener('resize',resetView);
window.addEventListener('load',resetView);

// Während der Entwicklung absichtlich ohne Service-Worker-Cache,
// damit GitHub Pages auf dem iPhone immer die aktuelle Version lädt.
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
  caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k))));
}
