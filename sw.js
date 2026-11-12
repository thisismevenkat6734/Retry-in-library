"use strict";

/* =========================================================
   RETRY IN LIBRARY
   File: sw.js
   Purpose: Progressive Web App Service Worker
   ========================================================= */

const CACHE_PREFIX = "retry-in-library";
const CACHE_VERSION = "v1";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/css/responsive.css",
  "./assets/js/app.js"
];

/* ---------------------------------------------------------
   INSTALL
--------------------------------------------------------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        CORE_ASSETS.map((asset) => cache.add(asset))
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            "Could not cache asset:",
            CORE_ASSETS[index]
          );
        }
      });
    })
  );

  self.skipWaiting();
});

/* ---------------------------------------------------------
   ACTIVATE
--------------------------------------------------------- */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      const oldCaches = cacheNames.filter(
        (name) =>
          name.startsWith(CACHE_PREFIX) &&
          name !== CACHE_NAME
      );

      await Promise.all(
        oldCaches.map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })
  );
});

/* ---------------------------------------------------------
   FETCH
--------------------------------------------------------- */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestURL = new URL(request.url);

  // Never intercept requests to other websites.
  if (requestURL.origin !== self.location.origin) return;

  // Only handle HTTP and HTTPS requests.
  if (
    requestURL.protocol !== "http:" &&
    requestURL.protocol !== "https:"
  ) {
    return;
  }

  // Navigation: network first, cached page as fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseCopy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseCopy);
            });
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);

          if (cachedPage) return cachedPage;

          return (
            (await caches.match("./index.html")) ||
            new Response(
              "You are offline. Please reconnect to access this page.",
              {
                status: 503,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                }
              }
            )
          );
        })
    );

    return;
  }

  // Static assets: cache first, then network.
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(request);

        if (
          networkResponse &&
          networkResponse.ok &&
          networkResponse.type === "basic"
        ) {
          const responseCopy = networkResponse.clone();

          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, responseCopy);
        }

        return networkResponse;
      } catch (error) {
        return new Response("Resource unavailable offline.", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })
  );
});
