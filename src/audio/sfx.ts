/** Small sound effects synthesised with the Web Audio API — no audio files needed. */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/** Call from the first user gesture (iOS starts AudioContexts suspended). */
export function unlockSfx() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    // Play one silent sample; older iOS needs this to really unlock output.
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', gain = 0.18) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function play(fn: () => void) {
  if (!enabled || !ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  fn();
}

/** Bright rising arpeggio. */
export const sfxCorrect = () =>
  play(() => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.35)));

/** Soft, friendly two-note "hmm" — deliberately not a buzzer. */
export const sfxGentle = () =>
  play(() => {
    tone(392, 0, 0.35, 'sine', 0.12);
    tone(329.63, 0.18, 0.45, 'sine', 0.12);
  });

/** Tiny click for selecting an answer. */
export const sfxTap = () => play(() => tone(880, 0, 0.08, 'sine', 0.08));

/** Little fanfare for the end of a round. */
export const sfxFanfare = () =>
  play(() =>
    [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, i * 0.12, i === 5 ? 0.7 : 0.2, 'triangle', 0.16),
    ),
  );

/** Short bright tick, one per star as the stars pop in. */
export const sfxStar = (i = 0) => play(() => tone(1046.5 * Math.pow(2, (i % 8) / 12), 0, 0.12, 'sine', 0.1));

/** Pop of the present opening, then a sparkly run up for the sticker. */
export const sfxSticker = () =>
  play(() => {
    tone(220, 0, 0.12, 'square', 0.06);
    [1318.5, 1568, 1760, 2093, 2637].forEach((f, i) => tone(f, 0.1 + i * 0.05, 0.25, 'sine', 0.09));
  });

/** Warm major chord with a high shimmer for a new badge. */
export const sfxBadge = () =>
  play(() => {
    [523.25, 659.25, 783.99].forEach((f) => tone(f, 0, 0.9, 'triangle', 0.1));
    [1568, 2093].forEach((f, i) => tone(f, 0.25 + i * 0.12, 0.5, 'sine', 0.06));
  });

/** Three falling water drops for the plant. */
export const sfxWater = () =>
  play(() => [1200, 950, 1100].forEach((f, i) => tone(f, i * 0.22, 0.12, 'sine', 0.1)));

/** Little rising "grow" sweep. */
export const sfxGrow = () => play(() => [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.07, 0.2, 'sine', 0.08)));
