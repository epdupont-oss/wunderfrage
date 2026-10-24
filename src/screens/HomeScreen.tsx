import { useEffect, useState } from 'preact/hooks';
import { Avatar } from '../components/Avatar';
import { HoldButton } from '../components/HoldButton';
import { Mascot } from '../components/Mascot';
import { ProgressRing } from '../components/Medal';
import { Plant } from '../components/Plant';
import { CATEGORIES, SURPRISE, type CategoryId, type CategoryMeta } from '../content/categories';
import { hasContent } from '../content/bank';
import { t } from '../i18n';
import { speak, speakNow } from '../speech/speech';
import { badgeProgress } from '../rewards/rewards';
import { STICKERS } from '../rewards/stickers';
import type { Profile, Progress } from '../storage/db';

export function HomeScreen({
  profile,
  progress,
  onStart,
  onSwitch,
  onParent,
  onBook,
}: {
  profile: Profile;
  progress: Progress;
  onStart: (c: CategoryId | 'surprise') => void;
  onSwitch: () => void;
  onParent: () => void;
  onBook: () => void;
}) {
  const lang = profile.lang;
  const [plantBounce, setPlantBounce] = useState(false);
  const enabled = CATEGORIES.filter(
    (c) => profile.settings.categories.includes(c.id as CategoryId) && hasContent(c.id as CategoryId),
  );
  const tiles: CategoryMeta[] = enabled.length > 1 ? [...enabled, SURPRISE] : enabled;
  const days = progress.streak.days;

  useEffect(() => {
    // Queued, so it follows the "Hello <name>" from the profile tap instead of cutting it off.
    void speak(t(lang, 'home.choose'), lang);
  }, []);

  const tapPlant = () => {
    setPlantBounce(true);
    void speakNow(days === 0 ? t(lang, 'plant.none') : days === 1 ? t(lang, 'plant.one') : t(lang, 'plant.days', { n: days }), lang);
  };

  return (
    <main class="screen home-screen">
      <header class="topbar">
        <button type="button" class="chip" onClick={onSwitch} aria-label={t(lang, 'home.switch')}>
          <Avatar id={profile.avatar} size={48} />
          <span class="chip-name">{profile.name}</span>
        </button>
        <div class="topbar-right">
          <div class="chip stars" aria-label={`${progress.stars} ⭐`}>
            ⭐ <b>{progress.stars}</b>
          </div>
          <button
            type="button"
            class={`icon-btn plant-btn${plantBounce ? ' bounce' : ''}`}
            onClick={tapPlant}
            onAnimationEnd={() => setPlantBounce(false)}
            aria-label={t(lang, 'home.plant')}
          >
            <Plant days={days} size={40} />
          </button>
          <button type="button" class="chip book-btn" onClick={onBook} aria-label={t(lang, 'home.book')}>
            📒 <b>{progress.stickers.length}</b>
            <small>/{STICKERS.length}</small>
          </button>
        </div>
      </header>
      <div class="home-hello">
        <Mascot size={96} />
        <p class="bubble">{t(lang, 'home.choose')}</p>
      </div>
      <div class="tile-grid">
        {tiles.map((c) => {
          const ring = c.id === 'surprise' ? null : badgeProgress(progress.categoryCorrect[c.id as CategoryId] ?? 0);
          return (
            <button type="button" key={c.id} class="tile" style={{ '--tile': c.color }} onClick={() => onStart(c.id)}>
              {ring && (
                <span class="tile-ring">
                  <ProgressRing fraction={ring.fraction} best={ring.best} />
                </span>
              )}
              <span class="tile-icon" aria-hidden="true">
                {c.icon}
              </span>
              <span class="tile-label">{t(lang, `categories.${c.id}`)}</span>
            </button>
          );
        })}
      </div>
      {/* Parents only: kept away from the kids' buttons, below the tiles. */}
      <div class="parent-corner">
        <HoldButton label={t(lang, 'gate.hold')} onHeld={onParent}>
          ⚙️
        </HoldButton>
      </div>
    </main>
  );
}
