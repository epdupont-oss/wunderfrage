/** Original, simple animal characters drawn in SVG. */

export const AVATAR_IDS = ['fox', 'bunny', 'cat', 'bear', 'panda', 'frog', 'lion', 'chick'] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

const DARK = '#2b2340';

function Eyes({ y = 62, dx = 16 }: { y?: number; dx?: number }) {
  return (
    <g>
      <circle cx={60 - dx} cy={y} r="6" fill={DARK} />
      <circle cx={60 + dx} cy={y} r="6" fill={DARK} />
      <circle cx={62 - dx} cy={y - 2} r="2" fill="#fff" />
      <circle cx={62 + dx} cy={y - 2} r="2" fill="#fff" />
    </g>
  );
}

const Cheeks = ({ y = 78 }: { y?: number }) => (
  <g opacity="0.55">
    <circle cx="33" cy={y} r="7" fill="#ff8fa3" />
    <circle cx="87" cy={y} r="7" fill="#ff8fa3" />
  </g>
);

const Smile = ({ y = 84 }: { y?: number }) => (
  <path d={`M52 ${y} Q60 ${y + 8} 68 ${y}`} fill="none" stroke={DARK} stroke-width="3" stroke-linecap="round" />
);

function face(id: AvatarId) {
  switch (id) {
    case 'fox':
      return (
        <>
          <path d="M22 54 L28 12 L56 36 Z" fill="#f28c38" />
          <path d="M98 54 L92 12 L64 36 Z" fill="#f28c38" />
          <path d="M30 44 L32 22 L46 36 Z" fill="#fff2e0" />
          <path d="M90 44 L88 22 L74 36 Z" fill="#fff2e0" />
          <circle cx="60" cy="68" r="40" fill="#f28c38" />
          <path d="M22 72 Q60 120 98 72 Q80 88 60 88 Q40 88 22 72 Z" fill="#fff6ea" />
          <Eyes />
          <ellipse cx="60" cy="78" rx="5" ry="4" fill={DARK} />
          <Cheeks y={74} />
          <Smile y={84} />
        </>
      );
    case 'bunny':
      return (
        <>
          <ellipse cx="42" cy="28" rx="11" ry="28" fill="#f6f0fb" stroke="#d9cfe6" stroke-width="2" />
          <ellipse cx="78" cy="28" rx="11" ry="28" fill="#f6f0fb" stroke="#d9cfe6" stroke-width="2" />
          <ellipse cx="42" cy="30" rx="5" ry="19" fill="#f9c6d3" />
          <ellipse cx="78" cy="30" rx="5" ry="19" fill="#f9c6d3" />
          <circle cx="60" cy="72" r="38" fill="#f6f0fb" stroke="#d9cfe6" stroke-width="2" />
          <Eyes y={66} />
          <ellipse cx="60" cy="80" rx="5" ry="3.5" fill="#f28ca5" />
          <rect x="56" y="88" width="8" height="7" rx="2" fill="#fff" stroke="#d9cfe6" />
          <Cheeks y={80} />
          <path d="M52 86 Q56 90 60 86 Q64 90 68 86" fill="none" stroke={DARK} stroke-width="2.5" stroke-linecap="round" />
        </>
      );
    case 'cat':
      return (
        <>
          <path d="M24 52 L26 14 L54 34 Z" fill="#9aa7b8" />
          <path d="M96 52 L94 14 L66 34 Z" fill="#9aa7b8" />
          <path d="M31 42 L32 24 L45 34 Z" fill="#f9c6d3" />
          <path d="M89 42 L88 24 L75 34 Z" fill="#f9c6d3" />
          <circle cx="60" cy="68" r="40" fill="#9aa7b8" />
          <path d="M60 30 L56 44 M60 30 L60 46 M60 30 L64 44" stroke="#7e8a9c" stroke-width="3" stroke-linecap="round" />
          <Eyes />
          <path d="M55 76 L65 76 L60 81 Z" fill="#f28ca5" />
          <g stroke={DARK} stroke-width="1.6" stroke-linecap="round">
            <path d="M28 76 L44 79 M28 84 L44 83" />
            <path d="M92 76 L76 79 M92 84 L76 83" />
          </g>
          <Smile y={84} />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="28" cy="36" r="15" fill="#a8744f" />
          <circle cx="92" cy="36" r="15" fill="#a8744f" />
          <circle cx="28" cy="36" r="8" fill="#e0b48c" />
          <circle cx="92" cy="36" r="8" fill="#e0b48c" />
          <circle cx="60" cy="68" r="40" fill="#a8744f" />
          <ellipse cx="60" cy="82" rx="18" ry="14" fill="#e8c4a0" />
          <Eyes y={60} />
          <ellipse cx="60" cy="76" rx="6" ry="4.5" fill={DARK} />
          <Cheeks y={72} />
          <Smile y={84} />
        </>
      );
    case 'panda':
      return (
        <>
          <circle cx="28" cy="36" r="15" fill="#3a3a48" />
          <circle cx="92" cy="36" r="15" fill="#3a3a48" />
          <circle cx="60" cy="68" r="40" fill="#fbfbfd" stroke="#dcdce6" stroke-width="2" />
          <ellipse cx="44" cy="62" rx="11" ry="13" fill="#3a3a48" transform="rotate(-20 44 62)" />
          <ellipse cx="76" cy="62" rx="11" ry="13" fill="#3a3a48" transform="rotate(20 76 62)" />
          <circle cx="45" cy="62" r="4.5" fill="#fff" />
          <circle cx="75" cy="62" r="4.5" fill="#fff" />
          <ellipse cx="60" cy="78" rx="6" ry="4" fill={DARK} />
          <Cheeks y={78} />
          <Smile y={85} />
        </>
      );
    case 'frog':
      return (
        <>
          <circle cx="38" cy="40" r="17" fill="#7cc46b" />
          <circle cx="82" cy="40" r="17" fill="#7cc46b" />
          <ellipse cx="60" cy="74" rx="46" ry="34" fill="#7cc46b" />
          <circle cx="38" cy="40" r="10" fill="#fff" />
          <circle cx="82" cy="40" r="10" fill="#fff" />
          <circle cx="39" cy="41" r="5.5" fill={DARK} />
          <circle cx="83" cy="41" r="5.5" fill={DARK} />
          <Cheeks y={78} />
          <path d="M36 80 Q60 100 84 80" fill="none" stroke={DARK} stroke-width="3" stroke-linecap="round" />
        </>
      );
    case 'lion':
      return (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={60 + Math.cos(a) * 40} cy={68 + Math.sin(a) * 40} r="16" fill="#d9822b" />;
          })}
          <circle cx="60" cy="68" r="38" fill="#d9822b" />
          <circle cx="60" cy="68" r="32" fill="#f6c453" />
          <circle cx="36" cy="44" r="7" fill="#f6c453" />
          <circle cx="84" cy="44" r="7" fill="#f6c453" />
          <Eyes y={62} dx={13} />
          <ellipse cx="60" cy="77" rx="6" ry="4.5" fill="#8a4b20" />
          <Cheeks y={78} />
          <Smile y={84} />
        </>
      );
    case 'chick':
      return (
        <>
          <path d="M56 30 Q52 14 60 18 Q64 8 68 22 Q74 16 70 32 Z" fill="#ffcf33" />
          <circle cx="60" cy="68" r="40" fill="#ffd84d" />
          <Eyes y={60} />
          <path d="M50 72 L70 72 L60 84 Z" fill="#ff9a2e" />
          <Cheeks y={74} />
          <path d="M22 78 Q14 90 26 96" fill="none" stroke="#f2bf22" stroke-width="5" stroke-linecap="round" />
          <path d="M98 78 Q106 90 94 96" fill="none" stroke="#f2bf22" stroke-width="5" stroke-linecap="round" />
        </>
      );
  }
}

export function Avatar({ id, size = 96 }: { id: string; size?: number }) {
  const known = (AVATAR_IDS as readonly string[]).includes(id) ? (id as AvatarId) : 'fox';
  return (
    <svg class="avatar" viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      {face(known)}
    </svg>
  );
}
