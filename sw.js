/* ═══════════════════════════════════════════════════
   AUTO SERVIS PRO — Service Worker
   Kešira aplikaciju za offline rad
   ═══════════════════════════════════════════════════ */

const CACHE_NAME = 'autoservis-v6';
const ASSETS = [
  '/',
  '/index.html'
];

/* Instalacija — keširaj fajlove */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* Aktivacija — očisti stari cache */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch — Network first, cache fallback */
self.addEventListener('fetch', function(e){
  // Supabase zahtjeve nikad ne keširaj
  if(e.request.url.includes('supabase.co')){
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Sačuvaj svjež odgovor u cache
        if(response && response.status === 200 && e.request.method === 'GET'){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function(){
        // Offline — vrati iz cache-a
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('/index.html');
        });
      })
  );
});
