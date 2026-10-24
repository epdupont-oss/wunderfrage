/**
 * Speech service. UI code only uses speak / cancel / unlockSpeech / onSpeakingChange,
 * so this module can later be replaced by one that plays pre-recorded audio files.
 *
 * We keep our own queue and hand the browser one utterance at a time, because the
 * built-in speechSynthesis queue is unreliable on iOS (lost utterances, missing onend).
 */
import type { Lang } from '../i18n';

const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

/** Regions in order of preference. de-CH first as requested, then standard German. */
const REGIONS: Record<Lang, string[]> = {
  de: ['de-CH', 'de-DE', 'de-AT'],
  en: ['en-GB', 'en-US', 'en-IE', 'en-AU', 'en-CA'],
  it: ['it-IT', 'it-CH'],
};

// Apple's novelty and "Eloquence" voices sound robotic or silly; avoid them for kids.
const NOVELTY =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy)\b/;

let voices: SpeechSynthesisVoice[] = [];
let chosen: Record<Lang, string> = { de: '', en: '', it: '' };
const voiceListeners = new Set<() => void>();

function refreshVoices() {
  voices = synth?.getVoices() ?? [];
  voiceListeners.forEach((fn) => fn());
}
if (synth) {
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
  // Older Safari never fires voiceschanged; poll briefly instead.
  let tries = 0;
  const poll = setInterval(() => {
    if (voices.length || ++tries > 20) return clearInterval(poll);
    refreshVoices();
  }, 250);
}

const normTag = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();

function score(v: SpeechSynthesisVoice, lang: Lang): number {
  const tag = normTag(v);
  if (!tag.startsWith(lang)) return -Infinity;
  const regions = REGIONS[lang];
  const idx = regions.findIndex((r) => r.toLowerCase() === tag);
  let s = idx === 0 ? 30 : idx > 0 ? 20 - idx * 2 : 0;
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  if (n.includes('premium')) s += 100;
  else if (/enhanced|erweitert|migliorat|neural|natural/.test(n)) s += 80;
  if (n.includes('compact')) s -= 10;
  if (NOVELTY.test(n)) s -= 200;
  if (v.localService) s += 5; // works offline
  return s;
}

/** Voices available for a language, best first, without novelty voices (unless that is all there is). */
export function voicesFor(lang: Lang): SpeechSynthesisVoice[] {
  const all = voices.filter((v) => normTag(v).startsWith(lang)).sort((a, b) => score(b, lang) - score(a, lang));
  const usable = all.filter((v) => score(v, lang) > -100);
  return usable.length ? usable : all;
}

export function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  const list = voicesFor(lang);
  return list.find((v) => v.voiceURI === chosen[lang]) ?? list[0] ?? null;
}

/** Parent-chosen voice per language ('' = automatic). */
export function setVoicePreferences(prefs: Record<Lang, string>) {
  chosen = { ...prefs };
}

export function onVoicesChanged(fn: () => void) {
  voiceListeners.add(fn);
  return () => voiceListeners.delete(fn);
}

export const speechSupported = () => !!synth;

// ---- queue -------------------------------------------------------------------

interface Item {
  text: string;
  lang: Lang;
  rate: number;
  resolve: (completed: boolean) => void;
}

let defaultRate = 0.9;
let queue: Item[] = [];
let current: Item | null = null;
// Keep a reference to the live utterance: Chrome garbage-collects it otherwise and never fires onend.
const live: { utterance: SpeechSynthesisUtterance | null } = { utterance: null };
let watchdog: ReturnType<typeof setTimeout> | undefined;
let cancelledAt = 0;
const speakingListeners = new Set<(speaking: boolean) => void>();

const emitSpeaking = (v: boolean) => speakingListeners.forEach((fn) => fn(v));

export function setSpeechRate(rate: number) {
  defaultRate = rate;
}

export function onSpeakingChange(fn: (speaking: boolean) => void) {
  speakingListeners.add(fn);
  return () => speakingListeners.delete(fn);
}

function finish(item: Item, completed: boolean) {
  if (current !== item) return;
  clearTimeout(watchdog);
  current = null;
  live.utterance = null;
  item.resolve(completed);
  if (queue.length) pump();
  else emitSpeaking(false);
}

function pump() {
  if (!synth || current || !queue.length) return;
  // iOS sometimes drops an utterance spoken right after cancel(); give it a moment.
  const sinceCancel = Date.now() - cancelledAt;
  if (sinceCancel < 80) {
    setTimeout(pump, 80 - sinceCancel);
    return;
  }
  const item = queue.shift()!;
  current = item;
  const u = new SpeechSynthesisUtterance(item.text);
  const voice = voiceFor(item.lang);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? REGIONS[item.lang][1] ?? item.lang;
  u.rate = item.rate;
  u.pitch = 1.05;
  u.onend = () => finish(item, true);
  u.onerror = (e) => finish(item, e.error !== 'interrupted' && e.error !== 'canceled');
  live.utterance = u;
  emitSpeaking(true);
  if (synth.paused) synth.resume();
  synth.speak(u);
  // Watchdog: iOS occasionally never fires onend. Allow generously for slow rates.
  const ms = 2500 + (item.text.length * 90) / Math.max(item.rate, 0.4);
  watchdog = setTimeout(() => finish(item, true), ms);
}

/**
 * Queue text to be spoken. Resolves true when it was spoken to the end,
 * false when it was cancelled (e.g. by navigation) or speech is unavailable.
 */
export function speak(text: string, lang: Lang, opts: { rate?: number } = {}): Promise<boolean> {
  if (!synth || !text.trim()) return Promise.resolve(false);
  return new Promise((resolve) => {
    queue.push({ text, lang, rate: opts.rate ?? defaultRate, resolve });
    pump();
  });
}

/** Stop speaking now and drop everything queued. */
export function cancel() {
  const pending = [...(current ? [current] : []), ...queue];
  queue = [];
  current = null;
  live.utterance = null;
  clearTimeout(watchdog);
  if (synth && (synth.speaking || synth.pending)) {
    synth.cancel();
    cancelledAt = Date.now();
  }
  pending.forEach((i) => i.resolve(false));
  emitSpeaking(false);
}

/** Cancel, then speak — for "tap to hear" interactions. */
export function speakNow(text: string, lang: Lang, opts?: { rate?: number }) {
  cancel();
  cancelledAt = 0; // in a user gesture we must call speak() synchronously
  return speak(text, lang, opts);
}

/**
 * iOS only allows speech that starts inside a user gesture. Call this synchronously
 * from the first tap handler; afterwards speech works for the rest of the session.
 */
export function unlockSpeech() {
  if (!synth) return;
  refreshVoices();
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel();
  });
}
