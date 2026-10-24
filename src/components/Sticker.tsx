import { stickerColor, type StickerDef } from '../rewards/stickers';

// A small, stable tilt per sticker so the book looks hand-stuck.
const tilt = (id: string) => ([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) % 13) - 6;

/** A die-cut sticker: a picture plus a small accessory. Locked stickers show as a silhouette. */
export function Sticker({ def, size = 96, locked = false }: { def: StickerDef; size?: number; locked?: boolean }) {
  return (
    <span
      class={`sticker${locked ? ' locked' : ''}`}
      style={{ '--size': `${size}px`, '--bg': stickerColor(def), transform: `rotate(${tilt(def.id)}deg)` }}
      aria-hidden="true"
    >
      <span class="sticker-main">{def.main}</span>
      <span class={`sticker-acc at-${def.corner}`}>{def.accessory}</span>
    </span>
  );
}
