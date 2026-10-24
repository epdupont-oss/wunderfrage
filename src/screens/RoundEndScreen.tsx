import { useEffect, useState } from 'preact/hooks';
import { Confetti } from '../components/Confetti';
import { Mascot } from '../components/Mascot';
import { Medal } from '../components/Medal';
import { Plant } from '../components/Plant';
import { Sticker } from '../components/Sticker';
import { CATEGORIES } from '../content/categories';
import { t, type Lang } from '../i18n';
import { speakNow, speak } from '../speech/speech';
import { sfxBadge, sfxFanfare, sfxGrow, sfxStar, sfxSticker, sfxWater } from '../audio/sfx';
import { starsToNextSticker, type Reward } from '../rewards/rewards';
import { stickerById, STICKERS } from '../rewards/stickers';
import type { Level, Progress } from '../storage/db';

interface Props {
  lang: Lang;
  level: Level;
  stars: number;
  total: number;
  rewards: Reward[];
  progress: Progress;
  onAgain: () => void;
  onHome: () => void;
  onBook: () => void;
}

/** Timers that are cleared when the step changes or the screen closes. */
function useTimers() {
  const [timers] = useState<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
}

/**
 * End of a round: first the stars, then one step per reward (sticker, badge, plant),
 * then buttons to play again, go home or open the collection.
 */
export function RoundEndScreen(props: Props) {
  const { rewards } = props;
  const [step, setStep] = useState(0);
  const [opened, setOpened] = useState(false);
  const isLast = step === rewards.length;
  const next = () => {
    setStep(step + 1);
    setOpened(false);
  };
  // A sticker has to be unwrapped before moving on.
  const waiting = step > 0 && rewards[step - 1].kind === 'sticker' && !opened;

  return (
    <main class="screen center-screen round-end">
      {step === 0 ? (
        <Summary {...props} />
      ) : (
        <RewardStep key={step} lang={props.lang} reward={rewards[step - 1]} onOpened={() => setOpened(true)} />
      )}
      {waiting ? null : isLast ? (
        <Finish {...props} />
      ) : (
        <button type="button" class={`next-btn pulse${step === 0 ? ' gift' : ''}`} onClick={next} aria-label="▶">
          {step === 0 ? '🎁' : '▶'}
        </button>
      )}
    </main>
  );
}

function nextStickerLine(lang: Lang, progress: Progress, level: Level) {
  if (progress.stickers.length >= STICKERS.length) return t(lang, 'rewards.allStickers');
  const n = starsToNextSticker(progress, level);
  return n === 1 ? t(lang, 'rewards.nextStickerOne') : t(lang, 'rewards.nextSticker', { n });
}

function Summary({ lang, level, stars, total, rewards, progress }: Props) {
  const later = useTimers();
  const line =
    stars === 0 ? t(lang, 'roundEnd.starsNone') : stars === 1 ? t(lang, 'roundEnd.starsOne') : t(lang, 'roundEnd.stars', { n: stars });
  const perfect = stars === total && total > 0;

  useEffect(() => {
    sfxFanfare();
    for (let i = 0; i < stars; i++) later(() => sfxStar(i), 700 + i * 150);
    const parts = [t(lang, 'roundEnd.title'), line, perfect ? t(lang, 'roundEnd.perfect') : ''];
    parts.push(rewards.length ? t(lang, 'rewards.present') : nextStickerLine(lang, progress, level));
    void speakNow(parts.filter(Boolean).join(' '), lang);
  }, []);

  return (
    <>
      <Confetti pieces={perfect ? 90 : 60} />
      <div class="bob">
        <Mascot size={140} mood="happy" />
      </div>
      <h1 class="screen-title">{t(lang, 'roundEnd.title')}</h1>
      <div class="star-row" aria-label={`${stars} / ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} class={i < stars ? 'star won' : 'star'} style={{ animationDelay: `${0.7 + 0.15 * i}s` }}>
            ⭐
          </span>
        ))}
      </div>
      <p class="bubble">
        {line}
        {perfect && <> {t(lang, 'roundEnd.perfect')}</>}
      </p>
    </>
  );
}

function RewardStep({ lang, reward, onOpened }: { lang: Lang; reward: Reward; onOpened: () => void }) {
  if (reward.kind === 'sticker') return <StickerReveal lang={lang} id={reward.id} onOpened={onOpened} />;
  if (reward.kind === 'badge') return <BadgeReveal lang={lang} reward={reward} />;
  return <PlantReveal lang={lang} reward={reward} />;
}

function StickerReveal({ lang, id, onOpened }: { lang: Lang; id: string; onOpened: () => void }) {
  const def = stickerById(id)!;
  const [open, setOpen] = useState(false);
  useEffect(() => void speakNow(t(lang, 'rewards.tapToOpen'), lang), []);
  const unwrap = () => {
    if (open) return;
    setOpen(true);
    onOpened();
    sfxSticker();
    void speakNow(t(lang, 'rewards.newSticker', { name: def.name[lang] }), lang);
  };
  return open ? (
    <div class="reveal">
      <Confetti />
      <span class="burst" aria-hidden="true" />
      <div class="pop-spin">
        <Sticker def={def} size={200} />
      </div>
      <p class="bubble">{t(lang, 'rewards.newSticker', { name: def.name[lang] })}</p>
    </div>
  ) : (
    <div class="reveal">
      <button type="button" class="gift-box" onClick={unwrap} aria-label={t(lang, 'rewards.tapToOpen')}>
        🎁
      </button>
      <p class="bubble">{t(lang, 'rewards.tapToOpen')}</p>
    </div>
  );
}

function BadgeReveal({ lang, reward }: { lang: Lang; reward: Extract<Reward, { kind: 'badge' }> }) {
  const icon = CATEGORIES.find((c) => c.id === reward.category)?.icon ?? '⭐';
  const text = t(lang, 'rewards.newBadge', {
    tier: t(lang, `rewards.tier${reward.tier}`),
    category: t(lang, `categories.${reward.category}`),
  });
  useEffect(() => {
    sfxBadge();
    void speakNow(text, lang);
  }, []);
  return (
    <div class="reveal">
      <Confetti />
      <span class="burst" aria-hidden="true" />
      <div class="drop-in">
        <Medal tier={reward.tier} icon={icon} size={150} />
      </div>
      <p class="bubble">{text}</p>
    </div>
  );
}

function PlantReveal({ lang, reward }: { lang: Lang; reward: Extract<Reward, { kind: 'plant' }> }) {
  const later = useTimers();
  const [watered, setWatered] = useState(false);
  useEffect(() => {
    sfxWater();
    void speakNow(t(lang, 'rewards.plantWater'), lang);
    later(() => {
      setWatered(true);
      if (reward.grew) {
        sfxGrow();
        void speak(t(lang, 'rewards.plantGrew'), lang);
      }
    }, 1600);
  }, []);
  const days = watered ? reward.days : reward.days - 1;
  return (
    <div class="reveal plant-reveal">
      {!watered && (
        <span class="drops" aria-hidden="true">
          <span>💧</span>
          <span>💧</span>
          <span>💧</span>
        </span>
      )}
      <div class={watered && reward.grew ? 'grow-in' : ''} key={days}>
        <Plant days={days} size={230} />
      </div>
      <p class="bubble">
        {t(lang, 'rewards.plantWater')}
        {watered && reward.grew && <> {t(lang, 'rewards.plantGrew')}</>}
      </p>
    </div>
  );
}

function Finish({ lang, level, progress, onAgain, onHome, onBook }: Props) {
  return (
    <>
      <p class="muted next-sticker">⭐ {nextStickerLine(lang, progress, level)}</p>
      <div class="row">
        <button type="button" class="round-btn" onClick={onHome} aria-label={t(lang, 'roundEnd.home')}>
          🏠
        </button>
        <button type="button" class="round-btn book" onClick={onBook} aria-label={t(lang, 'roundEnd.book')}>
          📒
        </button>
        <button type="button" class="round-btn primary" onClick={onAgain} aria-label={t(lang, 'roundEnd.again')}>
          🔁
        </button>
      </div>
    </>
  );
}
