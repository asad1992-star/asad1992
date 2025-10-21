
const CACHE_NAME = 'vetclinic-cache-v2'; // Bump version to trigger update
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Assuming this path is handled by the dev server/build system
  '/manifest.json',
  '/vite.svg',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/@google/genai@^1.25.0'
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// Intercept fetch requests and serve from cache if available, otherwise fetch from network and cache the result
self.addEventListener('fetch', event => {
  // Ignore non-GET requests and chrome extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get the response from the cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If it's not in the cache, try to fetch it from the network
      try {
        const networkResponse = await fetch(event.request);
        // If the fetch is successful, clone the response and cache it for future offline use
        if (networkResponse.ok) {
           await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.error('Fetch failed; network request for ', event.request.url, ' threw an error.', error);
        // This is where you might return a fallback offline page if you had one.
        // e.g., return caches.match('/offline.html');
        throw error; // Propagate the error to be caught by the browser
      }
    })
  );
});

// Activate event to clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages under this scope immediately
  );
});
