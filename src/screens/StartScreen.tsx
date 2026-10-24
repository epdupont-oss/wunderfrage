import { Mascot } from '../components/Mascot';
import { t, type Lang } from '../i18n';
import { speakNow, unlockSpeech } from '../speech/speech';
import { unlockSfx } from '../audio/sfx';

/**
 * Every launch begins here: iOS only allows audio after a user gesture,
 * so the big start button unlocks speech and sound effects.
 */
export function StartScreen({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const start = () => {
    // Must run synchronously inside the tap handler.
    unlockSpeech();
    unlockSfx();
    void speakNow(t(lang, 'start.greeting'), lang);
    onStart();
  };
  return (
    <main class="screen start-screen">
      <h1 class="logo-title">Wunderfrage</h1>
      <div class="bob">
        <Mascot size={220} />
      </div>
      <button type="button" class="big-play" onClick={start} aria-label={t(lang, 'start.go')}>
        <span aria-hidden="true">▶</span>
      </button>
    </main>
  );
}
