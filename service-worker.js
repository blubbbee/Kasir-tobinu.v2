const CACHE='tobinu-kasir-pwa-v3';
const ASSETS=[
  './','./index.html','./style.css','./script.js','./manifest.json',
  './assets/icon-192.png','./assets/icon-512.png','./assets/logo.png','./assets/bg.jpg',
  './assets/menu/americano.jpg','./assets/menu/latte.jpg','./assets/menu/matcha.jpg','./assets/menu/fries.jpg'
];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate',e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch',e=>{
  const {request}=e;
  e.respondWith(caches.match(request).then(res=> res || fetch(request).then(net=>{
    if(request.method==='GET'){ const copy=net.clone(); caches.open(CACHE).then(c=>c.put(request, copy)); }
    return net;
  }).catch(()=> caches.match('./index.html'))));
});
