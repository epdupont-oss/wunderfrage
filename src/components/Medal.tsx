import type { BadgeTier } from '../rewards/rewards';

/** Explorer badge: a medal on a ribbon in bronze, silver, gold or diamond, with the category icon. */
export function Medal({ tier, icon, size = 56, locked = false }: { tier: BadgeTier; icon: string; size?: number; locked?: boolean }) {
  return (
    <span class={`medal tier-${tier}${locked ? ' locked' : ''}`} style={{ '--size': `${size}px` }} aria-hidden="true">
      <span class="medal-ribbon" />
      <span class="medal-face">{icon}</span>
    </span>
  );
}

/** Small ring showing progress (0–1) towards the next badge, filled with the best medal's colour. */
export function ProgressRing({ fraction, best, size = 40 }: { fraction: number; best: BadgeTier | null; size?: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg class={`ring${best ? ` tier-${best}` : ''}`} viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <circle class="ring-bg" cx="20" cy="20" r={r} />
      <circle class="ring-fg" cx="20" cy="20" r={r} stroke-dasharray={c} stroke-dashoffset={c * (1 - fraction)} />
      <circle class="ring-dot" cx="20" cy="20" r="9" />
    </svg>
  );
}
