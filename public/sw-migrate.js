/*
 * Loaded into the service worker (workbox importScripts).
 *
 * One-time migration: the very first published version of Wunderfrage expected every
 * new version to take over by itself. Newer versions wait for a calm moment instead
 * (see src/pwa.ts), which an old window never signals. So when a new version installs,
 * ask each open window whether it runs the new code; if any window does not answer,
 * it is the old version: take over right away so it can reload into the new one.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const answers = await Promise.all(
        windows.map(
          (client) =>
            new Promise((resolve) => {
              const channel = new MessageChannel();
              const timer = setTimeout(() => resolve(false), 1500);
              channel.port1.onmessage = () => {
                clearTimeout(timer);
                resolve(true);
              };
              client.postMessage({ type: 'WUNDERFRAGE_PING' }, [channel.port2]);
            }),
        ),
      );
      if (answers.includes(false)) self.skipWaiting();
    })(),
  );
});
