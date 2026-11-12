"use strict";

/**
 * RETRY IN LIBRARY
 * File: sw.js
 *
 * Purpose:
 * - Cache essential application files
 * - Support previously visited pages offline
 * - Network-first navigation
 * - Cache-first static assets
 * - Remove outdated application caches
 */

const CACHE_PREFIX = "retry-in-library-";

const CACHE_VERSION = "v1";

const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/css/responsive.css",
  "./assets/css/reader.css",
  "./assets/js/app.js"
];

/**
 * Install: cache essential application files.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(APP_SHELL);

      await self.skipWaiting();
    })()
  );
});

/**
 * Activate: remove outdated caches belonging
 * to this application only.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith(CACHE_PREFIX) &&
              name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

/**
 * Cache a successful same-origin GET response.
 * Opaque and unsuccessful responses are not cached.
 */
async function cacheResponse(request, response) {
  if (!response || !response.ok) {
    return;
  }

  if (response.type !== "basic") {
    return;
  }

  const cache = await caches.open(CACHE_NAME);

  await cache.put(request, response.clone());
}

/**
 * Network-first strategy for page navigation.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);

    if (response.ok && response.type === "basic") {
      await cacheResponse(request, response);
    }

    return response;
  } catch (error) {
    const cachedPage = await caches.match(request);

    if (cachedPage) {
      return cachedPage;
    }

    const offlineHome = await caches.match("./index.html");

    if (offlineHome) {
      return offlineHome;
    }

    return new Response(
      "You are offline. Please reconnect to the internet and try again.",
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
}

/**
 * Cache-first strategy for static assets.
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    await cacheResponse(request, response);

    return response;
  } catch (error) {
    return new Response(
      "This resource is not available offline.",
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
}

/**
 * Fetch: handle only same-origin GET requests.
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestURL = new URL(request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  const destination = request.destination;

  const isStaticAsset = [
    "style",
    "script",
    "image",
    "font"
  ].includes(destination);

  if (isStaticAsset) {
    event.respondWith(handleStaticAsset(request));
  }
});

/**
 * Allow the application to request a cache refresh.
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
