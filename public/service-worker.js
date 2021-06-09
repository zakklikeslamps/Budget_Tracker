const FILES_TO_CACHE = [
    
]; 

const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => {
        console.log("precache successful!");
        return cache.addAll(FILES_TO_CACHE)})
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== PRECACHE && key !== RUNTIME) {
            console.log("Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", evt => {
    if(evt.request.url.includes('/api/' && evt.request.method === "GET")) {
        console.log("Service Worker fetching data....", evt.request.url);
 
//if request made to API, clone response and store in cache
evt.respondWith(
                caches.open(RUNTIME).then(cache => {
                return fetch(evt.request)
                .then(response => {
                    if (response.status === 200){
                        cache.put(evt.request, response.clone());
                    }
                    return response;
                })
                .catch(err => {
                  console.log(err);
                    return cache.match(evt.request);
                });
            })
            );
            return;
        }

        //if request is not for the API, send cache data
evt.respondWith(
    caches.open(PRECACHE).then( cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});