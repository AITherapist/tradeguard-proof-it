// Enhanced service worker with offline capabilities
const CACHE_NAME = 'tradeguard-v2';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic fetch handling for now
  event.respondWith(fetch(event.request));
});