var cacheName = 'mtl-transit-tracker-v1.2.1';
var filesToCache = [
    '.',
    'index.html',
    'assets/js/bootstrap.bundle.min.js',
    'assets/js/jquery-3.3.1.min.js',
    'assets/js/leaflet.min.js',
    'assets/js/script.min.js',
    'assets/js/tabulator.min.js',
    'assets/css/bootstrap.min.css',
    'assets/css/fontawesome.min.css',
    'assets/css/fontawesome-brands.min.css',
    'assets/css/fontawesome-solid.min.css',
    'assets/css/leaflet.css',
    'assets/css/style.min.css',
    'assets/css/tabulator.min.css',
    'assets/css/tabulator_bootstrap4.min.css',
    'assets/webfonts/fa-brands-400.woff2',
    'assets/webfonts/fa-solid-900.woff2',
    'assets/map-bus-stm.svg',
    'assets/map-train-exo.svg',
    'assets/images/joy-real-535919-unsplash-min.jpg',
    'assets/images/joy-real-587637-unsplash-min.jpg',
    'assets/images/nicolae-rosu-555257-unsplash-min.jpg'
];

self.addEventListener('install', function (e) {
    console.log('[SW] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[SW] Caching');
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', function (e) {

    console.log('[SW] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName) {
                    console.log('[SW] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    console.log('[SW] Fetch', e.request.url);
    e.respondWith(
        caches.match(e.request).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(e.request);
        })
    );
});