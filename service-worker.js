const CACHE_NAME = "deltaf-cache-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/login.html",
  "/pacientes.html",
  "/registro-profesional.html",
  "/img/logo-deltaf.png",
  "/manifest.json"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){
        return cache.addAll(APP_SHELL);
      })
      .catch(function(error){
        console.log("Cache inicial incompleto:", error);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){
          return key !== CACHE_NAME;
        }).map(function(key){
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET"){
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response){
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || caches.match("/index.html");
        });
      })
  );
});
