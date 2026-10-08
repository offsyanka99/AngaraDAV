/**
 * Installable portal scope. Network only: this worker does not cache the
 * portal or call the API. Requests under /portal/ pass through fetch().
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
