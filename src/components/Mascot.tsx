import { useEffect, useState } from 'preact/hooks';
import { onSpeakingChange } from '../speech/speech';

export type Mood = 'idle' | 'happy' | 'thinking';

/** Pip, the original owl mascot. Bobs and moves the beak while speech is playing. */
export function Mascot({ size = 120, mood = 'idle' }: { size?: number; mood?: Mood }) {
  const [talking, setTalking] = useState(false);
  useEffect(() => {
    const off = onSpeakingChange(setTalking);
    return () => void off();
  }, []);
  return (
    <svg
      class={`mascot mood-${mood}${talking ? ' talking' : ''}`}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <OwlBody />
    </svg>
  );
}

export function OwlBody() {
  return (
    <g class="owl">
      {/* ear tufts */}
      <path d="M52 62 L38 22 L84 48 Z" fill="#7d5fb2" />
      <path d="M148 62 L162 22 L116 48 Z" fill="#7d5fb2" />
      {/* body */}
      <ellipse cx="100" cy="112" rx="64" ry="72" fill="#8f71c4" />
      {/* wings */}
      <path class="wing-l" d="M40 100 Q22 140 54 172 Q50 132 40 100 Z" fill="#7d5fb2" />
      <path class="wing-r" d="M160 100 Q178 140 146 172 Q150 132 160 100 Z" fill="#7d5fb2" />
      {/* belly with feather scallops */}
      <ellipse cx="100" cy="138" rx="40" ry="44" fill="#fbe9c8" />
      <path d="M80 128 q5 6 10 0 q5 6 10 0 q5 6 10 0 q5 6 10 0" fill="none" stroke="#e7cfa1" stroke-width="3" stroke-linecap="round" />
      <path d="M84 146 q5 6 10 0 q5 6 10 0 q5 6 10 0" fill="none" stroke="#e7cfa1" stroke-width="3" stroke-linecap="round" />
      {/* eyes */}
      <circle cx="74" cy="88" r="25" fill="#fff" />
      <circle cx="126" cy="88" r="25" fill="#fff" />
      <g class="pupils">
        <circle cx="77" cy="90" r="12" fill="#2b2340" />
        <circle cx="123" cy="90" r="12" fill="#2b2340" />
        <circle cx="81" cy="85" r="4.5" fill="#fff" />
        <circle cx="127" cy="85" r="4.5" fill="#fff" />
      </g>
      {/* cheeks */}
      <circle cx="54" cy="114" r="8" fill="#ff9fb2" opacity="0.6" />
      <circle cx="146" cy="114" r="8" fill="#ff9fb2" opacity="0.6" />
      {/* beak: upper and lower part, the lower one opens while talking */}
      <path d="M90 106 L110 106 L100 118 Z" fill="#ffa630" />
      <path class="beak-lower" d="M93 114 L107 114 L100 124 Z" fill="#f08a1c" />
      {/* feet */}
      <ellipse cx="84" cy="184" rx="11" ry="6" fill="#ffa630" />
      <ellipse cx="116" cy="184" rx="11" ry="6" fill="#ffa630" />
    </g>
  );
}
