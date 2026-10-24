import { useEffect, useState } from 'preact/hooks';
import { deviceLang, type Lang } from './i18n';
import {
  loadAppSettings,
  loadProfiles,
  loadProgress,
  saveAppSettings,
  saveProfiles,
  saveProgress,
  requestPersistence,
  type AppSettings,
  type Profile,
  type Progress,
} from './storage/db';
import { cancel, setSpeechRate, setVoicePreferences } from './speech/speech';
import { setSoundEnabled } from './audio/sfx';
import type { CategoryId } from './content/categories';
import { loadCategories } from './content/bank';
import { buildRound, mathsPool, recordAnswer, type RoundQuestion } from './game/round';
import type { Question } from './content/schema';
import { StartScreen } from './screens/StartScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { RoundEndScreen } from './screens/RoundEndScreen';
import { ParentGate } from './screens/ParentGate';
import { ParentScreen } from './screens/ParentScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { collectRewards, type Reward } from './rewards/rewards';

export type Screen =
  | { name: 'start' }
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'quiz'; category: CategoryId | 'surprise'; round: RoundQuestion[] }
  | { name: 'roundEnd'; category: CategoryId | 'surprise'; stars: number; total: number; rewards: Reward[] }
  | { name: 'collection' }
  | { name: 'parent' };

export function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: 'start' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [app, setApp] = useState<AppSettings | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [persisted, setPersisted] = useState(false);

  const profile = profiles.find((p) => p.id === profileId) ?? null;

  useEffect(() => {
    (async () => {
      const [ps, as] = await Promise.all([loadProfiles(), loadAppSettings(deviceLang())]);
      setProfiles(ps);
      setApp(as);
      setVoicePreferences(as.voices);
      setReady(true);
      setPersisted(await requestPersistence());
    })();
  }, []);

  // Apply the active child's speech and sound settings.
  useEffect(() => {
    if (!profile) return;
    setSpeechRate(profile.settings.speechRate);
    setSoundEnabled(profile.settings.sound);
  }, [profile?.settings.speechRate, profile?.settings.sound]);

  /** Navigate. Speech is cancelled unless the caller wants it to continue onto the next screen. */
  const go = (next: Screen, keepSpeech = false) => {
    if (!keepSpeech) cancel();
    setScreen(next);
  };

  const updateProfiles = async (next: Profile[]) => {
    setProfiles(next);
    await saveProfiles(next);
  };

  const updateApp = async (next: AppSettings) => {
    setApp(next);
    setVoicePreferences(next.voices);
    await saveAppSettings(next);
  };

  const selectProfile = async (p: Profile) => {
    setProfileId(p.id);
    setProgress(await loadProgress(p.id));
    if (app) void updateApp({ ...app, lastProfileId: p.id });
    go({ name: 'home' }, true);
  };

  const startRound = async (category: CategoryId | 'surprise') => {
    if (!profile || !progress) return;
    const ids = category === 'surprise' ? profile.settings.categories : [category];
    const questions = await loadCategories(ids);
    if (ids.includes('maths')) questions.push(...mathsPool(profile.level, progress));
    const round = buildRound(questions, profile.level, profile.lang, progress);
    if (round.length) go({ name: 'quiz', category, round });
  };

  const answer = (q: Question, correct: boolean) => {
    if (!profile || !progress) return;
    const next = recordAnswer(progress, q, correct);
    setProgress(next);
    void saveProgress(profile.id, next);
  };

  const finishRound = (category: CategoryId | 'surprise', stars: number, total: number) => {
    if (!profile || !progress) return;
    const { progress: next, rewards } = collectRewards({ ...progress, rounds: progress.rounds + 1 }, profile.level);
    setProgress(next);
    void saveProgress(profile.id, next);
    go({ name: 'roundEnd', category, stars, total, rewards });
  };

  const markHintSeen = () => {
    if (profile && !profile.hintSeen) {
      void updateProfiles(profiles.map((p) => (p.id === profile.id ? { ...p, hintSeen: true } : p)));
    }
  };

  if (!ready || !app) return <div class="screen loading" />;

  const lastProfile = profiles.find((p) => p.id === app.lastProfileId);
  const kidLang: Lang = profile?.lang ?? lastProfile?.lang ?? app.parentLang;
  const openGate = () => setGateOpen(true);

  let view;
  switch (screen.name) {
    case 'start':
      view = <StartScreen lang={kidLang} onStart={() => go({ name: 'profiles' }, true)} />;
      break;
    case 'profiles':
      view = (
        <ProfilesScreen
          lang={kidLang}
          parentLang={app.parentLang}
          profiles={profiles}
          onSelect={selectProfile}
          onParent={openGate}
          onSetup={() => go({ name: 'parent' })}
        />
      );
      break;
    case 'home':
      view =
        profile && progress ? (
          <HomeScreen
            profile={profile}
            progress={progress}
            onStart={startRound}
            onSwitch={() => go({ name: 'profiles' })}
            onParent={openGate}
            onBook={() => go({ name: 'collection' })}
          />
        ) : null;
      break;
    case 'quiz':
      view = profile ? (
        <QuizScreen
          key={screen.round.map((r) => r.question.id).join()}
          profile={profile}
          category={screen.category}
          round={screen.round}
          onAnswer={answer}
          onHintSeen={markHintSeen}
          onFinish={(stars) => finishRound(screen.category, stars, screen.round.length)}
          onQuit={() => go({ name: 'home' })}
        />
      ) : null;
      break;
    case 'roundEnd':
      view =
        profile && progress ? (
          <RoundEndScreen
            lang={profile.lang}
            level={profile.level}
            stars={screen.stars}
            total={screen.total}
            rewards={screen.rewards}
            progress={progress}
            onAgain={() => startRound(screen.category)}
            onHome={() => go({ name: 'home' })}
            onBook={() => go({ name: 'collection' })}
          />
        ) : null;
      break;
    case 'collection':
      view =
        profile && progress ? (
          <CollectionScreen profile={profile} progress={progress} onBack={() => go({ name: 'home' })} />
        ) : null;
      break;
    case 'parent':
      view = (
        <ParentScreen
          app={app}
          profiles={profiles}
          persisted={persisted}
          onAppChange={updateApp}
          onProfilesChange={updateProfiles}
          onDone={() => go({ name: profiles.length ? 'profiles' : 'start' })}
        />
      );
      break;
  }

  return (
    <>
      {view ?? <ProfilesScreen lang={kidLang} parentLang={app.parentLang} profiles={profiles} onSelect={selectProfile} onParent={openGate} onSetup={() => go({ name: 'parent' })} />}
      {gateOpen && (
        <ParentGate
          lang={app.parentLang}
          onCancel={() => setGateOpen(false)}
          onPass={() => {
            setGateOpen(false);
            go({ name: 'parent' });
          }}
        />
      )}
    </>
  );
}
