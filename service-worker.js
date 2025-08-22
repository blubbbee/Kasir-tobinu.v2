const CACHE = 'tobinu-kasir-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e=>{
  const { request } = e;
  e.respondWith(
    caches.match(request).then(res=> res || fetch(request).then(net=>{
      if(request.method==='GET'){
        const copy = net.clone();
        caches.open(CACHE).then(c=>c.put(request, copy));
      }
      return net;
    }).catch(()=> caches.match('./index.html')))
  );
});
