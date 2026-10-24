import { useRef, useState } from 'preact/hooks';

/** Button that fires only after being held down for `ms`. Used for the parent gate. */
export function HoldButton({
  ms = 3000,
  onHeld,
  label,
  children,
}: {
  ms?: number;
  onHeld: () => void;
  label: string;
  children: preact.ComponentChildren;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const start = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setHolding(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setHolding(false);
      onHeld();
    }, ms);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <button
      type="button"
      class={`hold-btn${holding ? ' holding' : ''}`}
      style={{ '--hold-ms': `${ms}ms` }}
      aria-label={label}
      title={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg class="hold-ring" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="17" />
      </svg>
      <span class="hold-icon">{children}</span>
    </button>
  );
}
