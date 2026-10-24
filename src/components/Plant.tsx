import { plantStage } from '../rewards/rewards';

interface Shape {
  h: number;
  leaves: number;
  flowers: number;
  bud?: boolean;
  butterfly?: boolean;
}

// One entry per stage in PLANT_STAGES: seed → sprout → leaves → bud → flowers → butterfly.
const SHAPES: Shape[] = [
  { h: 0, leaves: 0, flowers: 0 },
  { h: 10, leaves: 2, flowers: 0 },
  { h: 20, leaves: 2, flowers: 0 },
  { h: 32, leaves: 4, flowers: 0 },
  { h: 42, leaves: 4, flowers: 0, bud: true },
  { h: 50, leaves: 6, flowers: 1 },
  { h: 56, leaves: 6, flowers: 2 },
  { h: 62, leaves: 6, flowers: 3 },
  { h: 66, leaves: 8, flowers: 3, butterfly: true },
];

const GROUND = 86;

function Flower({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g class="flower">
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={x + Math.cos(a) * r} cy={y + Math.sin(a) * r} r={r * 0.75} fill={color} />;
      })}
      <circle cx={x} cy={y} r={r * 0.6} fill="#ffd34d" />
    </g>
  );
}

/** A potted plant that grows with the number of days played. It never wilts. */
export function Plant({ days, size = 64 }: { days: number; size?: number }) {
  const shape = SHAPES[plantStage(days)];
  const { h } = shape;
  const top = GROUND - h;
  const leafSize = 4 + Math.min(5, h / 8);
  return (
    <svg class="plant" viewBox="0 0 100 120" width={size} height={size * 1.2} aria-hidden="true">
      {shape.butterfly && (
        <text class="butterfly" x="74" y="28" font-size="18">
          🦋
        </text>
      )}
      {h > 0 && (
        <path d={`M50 ${GROUND} Q46 ${GROUND - h / 2} 50 ${top}`} fill="none" stroke="#4caf50" stroke-width="3.5" stroke-linecap="round" />
      )}
      {shape.flowers >= 2 && (
        <path d={`M49 ${GROUND - h * 0.6} Q40 ${GROUND - h * 0.66} 33 ${GROUND - h * 0.78}`} fill="none" stroke="#4caf50" stroke-width="2.5" />
      )}
      {shape.flowers >= 3 && (
        <path d={`M50 ${GROUND - h * 0.42} Q60 ${GROUND - h * 0.5} 68 ${GROUND - h * 0.64}`} fill="none" stroke="#4caf50" stroke-width="2.5" />
      )}
      {Array.from({ length: shape.leaves }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const k = Math.floor(i / 2);
        const y = GROUND - (h * (k + 1)) / (shape.leaves / 2 + 1);
        const cx = 50 + side * (leafSize + 1);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={y}
            rx={leafSize}
            ry={leafSize / 2}
            fill={i % 4 < 2 ? '#66bb6a' : '#81c784'}
            transform={`rotate(${side * -25} ${cx} ${y})`}
          />
        );
      })}
      {shape.bud && (
        <g>
          <ellipse cx="50" cy={top - 3} rx="4" ry="6" fill="#ff8fb8" />
          <path d={`M45 ${top} Q50 ${top - 4} 55 ${top}`} fill="#4caf50" />
        </g>
      )}
      {shape.flowers >= 1 && <Flower x={50} y={top - 2} r={6} color="#ff7eb6" />}
      {shape.flowers >= 2 && <Flower x={33} y={GROUND - h * 0.78 - 2} r={5} color="#b388ff" />}
      {shape.flowers >= 3 && <Flower x={68} y={GROUND - h * 0.64 - 2} r={5} color="#ff9f45" />}
      {h === 0 && (
        <g>
          <ellipse cx="50" cy="84" rx="4.5" ry="3" fill="#8d5a3b" />
          <ellipse cx="48.5" cy="83" rx="1.4" ry="0.9" fill="#c49272" />
        </g>
      )}
      {/* pot */}
      <path d="M28 94 L72 94 L67 116 Q66 119 63 119 L37 119 Q34 119 33 116 Z" fill="#d9774b" />
      <rect x="24" y="86" width="52" height="10" rx="4" fill="#e8895c" />
      <ellipse cx="50" cy="87.5" rx="22" ry="3" fill="#6b4a3a" />
      <path d="M36 104 q4 -3 8 0 q4 3 8 0 q4 -3 8 0" fill="none" stroke="#f0a27a" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
}
