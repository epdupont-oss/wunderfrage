/**
 * Service worker registration and app updates.
 *
 * A new version is downloaded in the background, but only switched to at a calm moment
 * (start screen or "who is playing?"), never in the middle of a round.
 */
import { registerSW } from 'virtual:pwa-register';

// Tell a newly installed service worker that this window runs the calm-update code,
// so it waits for a calm moment instead of taking over (see public/sw-migrate.js).
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'WUNDERFRAGE_PING') event.ports[0]?.postMessage({ type: 'WUNDERFRAGE_PONG' });
});
navigator.serviceWorker?.startMessages();

let updateReady = false;
let calm = false;

const updateSW = registerSW({
  onNeedRefresh() {
    updateReady = true;
    applyIfCalm();
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Look for a new version hourly and whenever the app comes back to the foreground.
    setInterval(() => void registration.update(), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void registration.update();
    });
  },
});

function applyIfCalm() {
  if (updateReady && calm) {
    updateReady = false;
    void updateSW(true); // activates the new version and reloads the page
  }
}

/** Tell the updater whether the app is at a calm moment where a reload is fine. */
export function setCalmMoment(isCalm: boolean) {
  calm = isCalm;
  applyIfCalm();
}
