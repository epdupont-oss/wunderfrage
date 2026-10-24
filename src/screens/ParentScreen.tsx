import { useEffect, useState } from 'preact/hooks';
import { Avatar, AVATAR_IDS } from '../components/Avatar';
import { CATEGORIES, type CategoryId } from '../content/categories';
import { hasContent } from '../content/bank';
import { LANG_NAMES, LANGS, t, type Lang } from '../i18n';
import { onVoicesChanged, speakNow, voiceFor, voicesFor } from '../speech/speech';
import {
  defaultSettings,
  deleteProgress,
  emptyProgress,
  loadProgress,
  newId,
  saveProgress,
  type AppSettings,
  type Level,
  type Profile,
} from '../storage/db';

export function ParentScreen({
  app,
  profiles,
  persisted,
  onAppChange,
  onProfilesChange,
  onDone,
}: {
  app: AppSettings;
  profiles: Profile[];
  persisted: boolean;
  onAppChange: (a: AppSettings) => void;
  onProfilesChange: (p: Profile[]) => Promise<void>;
  onDone: () => void;
}) {
  const lang = app.parentLang;
  // On first launch, jump straight into creating a profile.
  const [editing, setEditing] = useState<Profile | null>(() => (profiles.length ? null : blankProfile(lang)));
  const [stats, setStats] = useState<Record<string, { stars: number; answered: number }>>({});
  const [, forceVoices] = useState(0);

  useEffect(() => {
    const off = onVoicesChanged(() => forceVoices((n) => n + 1));
    return () => void off();
  }, []);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        profiles.map(async (p) => {
          const pr = await loadProgress(p.id);
          return [p.id, { stars: pr.stars, answered: Object.keys(pr.questions).length }] as const;
        }),
      );
      setStats(Object.fromEntries(entries));
    })();
  }, [profiles]);

  if (editing) {
    const isNew = !profiles.some((p) => p.id === editing.id);
    return (
      <ProfileEditor
        lang={lang}
        initial={editing}
        isNew={isNew}
        onCancel={() => (profiles.length ? setEditing(null) : onDone())}
        onSave={async (p) => {
          await onProfilesChange(isNew ? [...profiles, p] : profiles.map((x) => (x.id === p.id ? p : x)));
          setEditing(null);
        }}
        onReset={async (p) => {
          if (!confirm(t(lang, 'parent.resetConfirm', { name: p.name }))) return;
          await saveProgress(p.id, emptyProgress());
          await onProfilesChange(profiles.map((x) => (x.id === p.id ? { ...x, hintSeen: false } : x)));
          setEditing(null);
        }}
        onDelete={async (p) => {
          if (!confirm(t(lang, 'parent.deleteConfirm', { name: p.name }))) return;
          await deleteProgress(p.id);
          await onProfilesChange(profiles.filter((x) => x.id !== p.id));
          setEditing(null);
        }}
      />
    );
  }

  return (
    <main class="screen parent-screen">
      <header class="parent-header">
        <h1>{t(lang, 'parent.title')}</h1>
        <button type="button" class="btn primary" onClick={onDone}>
          {t(lang, 'parent.done')}
        </button>
      </header>

      <section class="card">
        <h2>{t(lang, 'parent.profiles')}</h2>
        <ul class="profile-list">
          {profiles.map((p) => (
            <li key={p.id}>
              <button type="button" class="profile-row" onClick={() => setEditing(p)}>
                <Avatar id={p.avatar} size={56} />
                <span>
                  <b>{p.name}</b>
                  <small>
                    {t(lang, p.level === 'little' ? 'parent.little' : 'parent.big')} · {LANG_NAMES[p.lang]}
                    {stats[p.id] && <> · {t(lang, 'parent.stats', stats[p.id])}</>}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" class="btn" onClick={() => setEditing(blankProfile(lang))}>
          ＋ {t(lang, 'parent.addProfile')}
        </button>
      </section>

      {profiles.length > 0 && (
        <section class="card">
          <h2>{t(lang, 'parent.speechRate')}</h2>
          {profiles.map((p) => (
            <SpeedRow
              key={p.id}
              lang={lang}
              profile={p}
              onSave={(speechRate) =>
                onProfilesChange(profiles.map((x) => (x.id === p.id ? { ...x, settings: { ...x.settings, speechRate } } : x)))
              }
            />
          ))}
        </section>
      )}

      <section class="card">
        <h2>{t(lang, 'parent.parentLanguage')}</h2>
        <Segmented
          value={lang}
          options={LANGS.map((l) => ({ value: l, label: LANG_NAMES[l] }))}
          onChange={(l) => onAppChange({ ...app, parentLang: l })}
        />
      </section>

      <section class="card">
        <h2>{t(lang, 'parent.voices')}</h2>
        {LANGS.map((l) => {
          const list = voicesFor(l);
          const auto = list[0];
          return (
            <div class="field voice-row" key={l}>
              <label>{LANG_NAMES[l]}</label>
              <select
                value={app.voices[l]}
                onChange={(e) => onAppChange({ ...app, voices: { ...app.voices, [l]: (e.target as HTMLSelectElement).value } })}
              >
                <option value="">
                  {auto ? t(lang, 'parent.voiceAuto', { voice: `${auto.name} (${auto.lang})` }) : t(lang, 'parent.voiceNone')}
                </option>
                {list.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button
                type="button"
                class="btn small"
                onClick={() => speakNow(t(l, 'parent.testSentence', { name: voiceFor(l)?.name ?? '' }), l)}
              >
                🔊
              </button>
            </div>
          );
        })}
        <p class="muted">{t(lang, 'parent.voiceTip')}</p>
      </section>

      <section class="card">
        <h2>{t(lang, 'parent.storage')}</h2>
        <p class="muted">{t(lang, persisted ? 'parent.persisted' : 'parent.notPersisted')}</p>
      </section>
    </main>
  );
}

function blankProfile(lang: Lang): Profile {
  return {
    id: newId(),
    name: '',
    avatar: AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)],
    level: 'big',
    lang,
    settings: defaultSettings('big'),
    hintSeen: false,
    createdAt: Date.now(),
  };
}

function ProfileEditor({
  lang,
  initial,
  isNew,
  onSave,
  onCancel,
  onReset,
  onDelete,
}: {
  lang: Lang;
  initial: Profile;
  isNew: boolean;
  onSave: (p: Profile) => void;
  onCancel: () => void;
  onReset: (p: Profile) => void;
  onDelete: (p: Profile) => void;
}) {
  const [p, setP] = useState(initial);
  const [error, setError] = useState('');
  const set = (patch: Partial<Profile>) => setP({ ...p, ...patch });
  const setS = (patch: Partial<Profile['settings']>) => setP({ ...p, settings: { ...p.settings, ...patch } });

  const setLevel = (level: Level) =>
    // Changing level also moves the speech rate to that level's default.
    setP({ ...p, level, settings: { ...p.settings, speechRate: defaultSettings(level).speechRate } });

  const toggleCategory = (id: CategoryId) =>
    setS({
      categories: p.settings.categories.includes(id)
        ? p.settings.categories.filter((c) => c !== id)
        : [...p.settings.categories, id],
    });

  const save = () => {
    const name = p.name.trim();
    if (!name) return setError(t(lang, 'parent.noName'));
    onSave({ ...p, name });
  };

  return (
    <main class="screen parent-screen">
      <header class="parent-header">
        <h1>{t(lang, isNew ? 'parent.newProfile' : 'parent.editProfile')}</h1>
      </header>

      <section class="card">
        <div class="field">
          <label for="pname">{t(lang, 'parent.name')}</label>
          <input
            id="pname"
            value={p.name}
            maxLength={20}
            autocomplete="off"
            onInput={(e) => set({ name: (e.target as HTMLInputElement).value })}
          />
          {error && <p class="error">{error}</p>}
        </div>

        <div class="field">
          <label>{t(lang, 'parent.avatar')}</label>
          <div class="avatar-picker">
            {AVATAR_IDS.map((id) => (
              <button
                type="button"
                key={id}
                class={id === p.avatar ? 'on' : ''}
                aria-pressed={id === p.avatar}
                aria-label={id}
                onClick={() => set({ avatar: id })}
              >
                <Avatar id={id} size={64} />
              </button>
            ))}
          </div>
        </div>

        <div class="field">
          <label>{t(lang, 'parent.level')}</label>
          <Segmented
            value={p.level}
            options={[
              { value: 'little', label: t(lang, 'parent.little') },
              { value: 'big', label: t(lang, 'parent.big') },
            ]}
            onChange={setLevel}
          />
        </div>

        <div class="field">
          <label>{t(lang, 'parent.language')}</label>
          <Segmented
            value={p.lang}
            options={LANGS.map((l) => ({ value: l, label: LANG_NAMES[l] }))}
            onChange={(l) => set({ lang: l })}
          />
        </div>

        <div class="field">
          <label>{t(lang, 'parent.speechRate')}</label>
          <SpeedControl
            lang={lang}
            voiceLang={p.lang}
            name={p.name}
            value={p.settings.speechRate}
            onInput={(speechRate) => setS({ speechRate })}
          />
        </div>

        <div class="field">
          <label>{t(lang, 'parent.sound')}</label>
          <Segmented
            value={p.settings.sound ? 'on' : 'off'}
            options={[
              { value: 'on', label: t(lang, 'parent.on') },
              { value: 'off', label: t(lang, 'parent.off') },
            ]}
            onChange={(v) => setS({ sound: v === 'on' })}
          />
        </div>

        <div class="field">
          <label>{t(lang, 'parent.categories')}</label>
          <div class="category-checks">
            {CATEGORIES.map((c) => {
              const id = c.id as CategoryId;
              return (
                <label key={id} class="check">
                  <input type="checkbox" checked={p.settings.categories.includes(id)} onChange={() => toggleCategory(id)} />
                  <span>
                    {c.icon} {t(lang, `categories.${id}`)}
                    {!hasContent(id) && <small> ({t(lang, 'parent.noQuestionsYet')})</small>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div class="row end">
          <button type="button" class="btn ghost" onClick={onCancel}>
            {t(lang, 'parent.cancel')}
          </button>
          <button type="button" class="btn primary" onClick={save}>
            {t(lang, 'parent.save')}
          </button>
        </div>
      </section>

      {!isNew && (
        <section class="card danger-zone">
          <button type="button" class="btn warn" onClick={() => onReset(p)}>
            {t(lang, 'parent.reset')}
          </button>
          <button type="button" class="btn warn" onClick={() => onDelete(p)}>
            {t(lang, 'parent.delete')}
          </button>
        </section>
      )}
    </main>
  );
}

/** Speaking-speed slider with a test button that speaks in the child's language at that speed. */
function SpeedControl({
  lang,
  voiceLang,
  name,
  value,
  onInput,
  onCommit,
}: {
  lang: Lang;
  voiceLang: Lang;
  name: string;
  value: number;
  onInput: (rate: number) => void;
  onCommit?: (rate: number) => void;
}) {
  const read = (e: Event) => Number((e.target as HTMLInputElement).value);
  return (
    <div class="rate-row">
      <small>{t(lang, 'parent.slower')}</small>
      <input
        type="range"
        min="0.5"
        max="1.3"
        step="0.05"
        value={value}
        aria-label={t(lang, 'parent.speechRate')}
        onInput={(e) => onInput(read(e))}
        onChange={(e) => onCommit?.(read(e))}
      />
      <small>{t(lang, 'parent.faster')}</small>
      <span class="rate-value">{Math.round(value * 100)}%</span>
      <button
        type="button"
        class="btn small"
        onClick={() => speakNow(t(voiceLang, 'parent.testSentence', { name: name || '…' }), voiceLang, { rate: value })}
      >
        🔊 {t(lang, 'parent.test')}
      </button>
    </div>
  );
}

/** One child's speed on the main parent screen; saved when the slider is released. */
function SpeedRow({ lang, profile, onSave }: { lang: Lang; profile: Profile; onSave: (rate: number) => void }) {
  const [rate, setRate] = useState(profile.settings.speechRate);
  return (
    <div class="speed-row">
      <span class="speed-who">
        <Avatar id={profile.avatar} size={40} />
        <b>{profile.name}</b>
      </span>
      <SpeedControl lang={lang} voiceLang={profile.lang} name={profile.name} value={rate} onInput={setRate} onCommit={onSave} />
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div class="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          class={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
