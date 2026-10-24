import { Avatar } from '../components/Avatar';
import { HoldButton } from '../components/HoldButton';
import { Mascot } from '../components/Mascot';
import { t, type Lang } from '../i18n';
import { speakNow } from '../speech/speech';
import type { Profile } from '../storage/db';

export function ProfilesScreen({
  lang,
  parentLang,
  profiles,
  onSelect,
  onParent,
  onSetup,
}: {
  lang: Lang;
  parentLang: Lang;
  profiles: Profile[];
  onSelect: (p: Profile) => void;
  onParent: () => void;
  onSetup: () => void;
}) {
  if (!profiles.length) {
    // First launch: nothing to protect yet, so setup skips the parent gate.
    return (
      <main class="screen center-screen">
        <Mascot size={160} />
        <div class="card setup-card">
          <h1>{t(parentLang, 'profiles.setupTitle')}</h1>
          <p>{t(parentLang, 'profiles.setupText')}</p>
          <button type="button" class="btn primary" onClick={onSetup}>
            {t(parentLang, 'profiles.setupButton')}
          </button>
        </div>
      </main>
    );
  }

  const pickProfile = (p: Profile) => {
    void speakNow(t(p.lang, 'profiles.hello', { name: p.name }), p.lang);
    onSelect(p);
  };

  return (
    <main class="screen center-screen">
      <div class="corner-tr">
        <HoldButton label={t(parentLang, 'gate.hold')} onHeld={onParent}>
          ⚙️
        </HoldButton>
      </div>
      <Mascot size={120} />
      <h1 class="screen-title">{t(lang, 'profiles.who')}</h1>
      <div class="profile-grid">
        {profiles.map((p) => (
          <button type="button" key={p.id} class="profile-btn" onClick={() => pickProfile(p)}>
            <Avatar id={p.avatar} size={140} />
            <span class="profile-name">{p.name}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
