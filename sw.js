//Ini Adalah Service Worker untuk aplikasi KodePWA Weather
// Pastikan file ini berada di direktori yang benar agar dapat diakses oleh browser

const CACHE_NAME = 'kodepwa-weather-v1';
const urlsToCache = [
  './',                              // ← Ganti ke relative
  './index.html',                    // ← Relative path
  './styles/style.css',             // ← Relative path
  './scripts/app.js',               // ← Relative path
  './images/add.svg',
  './images/clear-day.svg',
  './images/partly-cloudy-day.svg',
  './images/cloudy.svg',
  './images/rain.svg',
  './images/snow.svg',
  './images/wind.svg',
  './images/fog.svg',
  './images/clear-night.svg',
  './images/sleet.svg',
  './images/hail.svg',
  './images/thunderstorm.svg',
  './images/tornado.svg',
  './images/partly-cloudy-night.svg',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js'
];

// Install Service Worker dan cache files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Add error handling untuk debugging
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('Service Worker: All files cached successfully');
          })
          .catch((error) => {
            console.error('Service Worker: Failed to cache files:', error);
            // Try to cache files individually to see which ones fail
            return Promise.all(
              urlsToCache.map(url => {
                return cache.add(url)
                  .then(() => console.log(`Cached: ${url}`))
                  .catch(err => console.error(`Failed to cache: ${url}`, err));
              })
            );
          });
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate Service Worker dengan better logging
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('Existing caches:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      // Log cache contents untuk debugging
      return caches.open(CACHE_NAME);
    }).then((cache) => {
      return cache.keys();
    }).then((requests) => {
      console.log('Cached requests:', requests.map(req => req.url));
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Intercept network requests dengan better error handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Cache First Strategy untuk semua requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response to cache it
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                  .then(() => {
                    console.log('Service Worker: Cached response for:', event.request.url);
                  });
              });
            
            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error);
            // Network failed, try to show offline page
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Background sync (untuk future features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'weather-sync') {
    event.waitUntil(
      console.log('Service Worker: Background sync triggered')
      // Add your background sync logic here
    );
  }
});