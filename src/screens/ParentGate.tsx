import { useState } from 'preact/hooks';
import { t, type Lang } from '../i18n';

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
// Two-digit × one-digit: easy for a grown-up, out of reach for a child who knows the 10×10 table.
const newTask = () => ({ a: rand(13, 29), b: rand(6, 9) });

/** Second step of the parent gate (the first is holding the ⚙️ button for 3 seconds). Never spoken aloud. */
export function ParentGate({ lang, onPass, onCancel }: { lang: Lang; onPass: () => void; onCancel: () => void }) {
  const [task, setTask] = useState(newTask);
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (k: string) => {
    if (k === '⌫') return setInput((v) => v.slice(0, -1));
    if (k === 'OK') {
      if (Number(input) === task.a * task.b) return onPass();
      setWrong(true);
      setTask(newTask());
      setInput('');
      return;
    }
    setInput((v) => (v.length < 4 ? v + k : v));
  };

  return (
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="card gate">
        {wrong && <p class="muted">{t(lang, 'gate.wrong')}</p>}
        <p class="gate-question">{t(lang, 'gate.question', task)}</p>
        <div class="gate-input" aria-live="polite">
          {input || ' '}
        </div>
        <div class="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
            <button type="button" key={k} class={k === 'OK' ? 'btn primary' : 'btn'} onClick={() => press(k)}>
              {k === 'OK' ? t(lang, 'gate.ok') : k}
            </button>
          ))}
        </div>
        <button type="button" class="btn ghost" onClick={onCancel}>
          {t(lang, 'gate.cancel')}
        </button>
      </div>
    </div>
  );
}
