import { useEffect, useState } from 'preact/hooks';
import { Medal } from '../components/Medal';
import { Sticker } from '../components/Sticker';
import { CATEGORIES, type CategoryId } from '../content/categories';
import { hasContent } from '../content/bank';
import { t } from '../i18n';
import { speakNow } from '../speech/speech';
import { sfxTap } from '../audio/sfx';
import { BADGE_TIERS, badgeId, STICKER_COST, starsToNextSticker, type BadgeTier } from '../rewards/rewards';
import { STICKER_PAGES, STICKERS, type StickerDef } from '../rewards/stickers';
import type { Profile, Progress } from '../storage/db';

const BADGES_TAB = STICKER_PAGES.length;

/** Sticker book (one tab per page) plus a page with all explorer badges. */
export function CollectionScreen({ profile, progress, onBack }: { profile: Profile; progress: Progress; onBack: () => void }) {
  const lang = profile.lang;
  const [tab, setTab] = useState(0);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const owned = new Set(progress.stickers);
  const cost = STICKER_COST[profile.level];
  const toNext = starsToNextSticker(progress, profile.level);

  useEffect(() => {
    void speakNow(
      `${t(lang, 'collection.title')}. ${t(lang, 'collection.count', { n: owned.size, total: STICKERS.length })}`,
      lang,
    );
  }, []);

  const tapSticker = (st: StickerDef) => {
    sfxTap();
    setWiggle(st.id);
    void speakNow(owned.has(st.id) ? st.name[lang] : t(lang, 'collection.locked'), lang);
  };

  const tapTab = (i: number) => {
    setTab(i);
    void speakNow(i === BADGES_TAB ? t(lang, 'collection.badges') : STICKER_PAGES[i].name[lang], lang);
  };

  const tapBadge = (category: CategoryId, tier: BadgeTier) => {
    sfxTap();
    const have = progress.categoryCorrect[category] ?? 0;
    const vars = { tier: t(lang, `rewards.tier${tier}`), category: t(lang, `categories.${category}`), n: tier, have };
    void speakNow(
      progress.badges.includes(badgeId(category, tier)) ? t(lang, 'collection.badgeInfo', vars) : t(lang, 'collection.badgeLocked', vars),
      lang,
    );
  };

  return (
    <main class="screen collection-screen">
      <header class="topbar">
        <button type="button" class="icon-btn" onClick={onBack} aria-label={t(lang, 'roundEnd.home')}>
          🏠
        </button>
        <h1 class="collection-title">
          📒 {owned.size}/{STICKERS.length}
        </h1>
        <div class="next-meter" aria-label={t(lang, 'rewards.nextSticker', { n: toNext })}>
          {Array.from({ length: cost }, (_, i) => (
            <span key={i} class={i < cost - toNext ? 'on' : ''}>
              ⭐
            </span>
          ))}
        </div>
      </header>

      <nav class="book-tabs">
        {STICKER_PAGES.map((p, i) => (
          <button type="button" key={i} class={tab === i ? 'on' : ''} onClick={() => tapTab(i)} aria-label={p.name[lang]}>
            {p.icon}
          </button>
        ))}
        <button type="button" class={tab === BADGES_TAB ? 'on' : ''} onClick={() => tapTab(BADGES_TAB)} aria-label={t(lang, 'collection.badges')}>
          🏅
        </button>
      </nav>

      {tab < BADGES_TAB ? (
        <section class="book-page">
          <h2>{STICKER_PAGES[tab].name[lang]}</h2>
          <div class="sticker-grid">
            {STICKERS.filter((st) => st.page === tab).map((st) => (
              <button
                type="button"
                key={st.id}
                class={`sticker-slot${wiggle === st.id ? ' wiggle' : ''}`}
                onClick={() => tapSticker(st)}
                onAnimationEnd={() => setWiggle(null)}
                aria-label={owned.has(st.id) ? st.name[lang] : t(lang, 'collection.locked')}
              >
                <Sticker def={st} size={84} locked={!owned.has(st.id)} />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section class="book-page badges-page">
          <h2>{t(lang, 'collection.badges')}</h2>
          {CATEGORIES.filter((c) => hasContent(c.id as CategoryId) && profile.settings.categories.includes(c.id as CategoryId)).map((c) => {
            const id = c.id as CategoryId;
            return (
              <div class="badge-row" key={id}>
                <span class="badge-cat">
                  <span class="badge-cat-icon">{c.icon}</span>
                  <span>
                    <b>{t(lang, `categories.${id}`)}</b>
                    <small>✓ {progress.categoryCorrect[id] ?? 0}</small>
                  </span>
                </span>
                <span class="badge-medals">
                  {BADGE_TIERS.map((tier) => (
                    <button type="button" key={tier} onClick={() => tapBadge(id, tier)} aria-label={t(lang, `rewards.tier${tier}`)}>
                      <Medal tier={tier} icon={c.icon} size={44} locked={!progress.badges.includes(badgeId(id, tier))} />
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
