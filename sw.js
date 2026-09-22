const C='hidden-object-v04';
const A=['./','index.html','style.css','app.js','manifest.webmanifest','scene-game.png','auto.png','hut.png','lupe.png','schluessel.png','kompass.png','clean-auto.png','clean-hut.png','clean-lupe.png','clean-schluessel.png','clean-kompass.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
