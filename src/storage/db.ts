import { createStore, get, set, del } from 'idb-keyval';
import type { Lang } from '../i18n';
import type { CategoryId } from '../content/categories';
import { CATEGORY_IDS } from '../content/categories';

const store = createStore('wunderfrage', 'kv');

export type Level = 'little' | 'big';

export interface ProfileSettings {
  /** Web Speech rate, 1 = normal. */
  speechRate: number;
  sound: boolean;
  categories: CategoryId[];
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  level: Level;
  lang: Lang;
  settings: ProfileSettings;
  /** The "tap once to hear, twice to choose" hint has been shown. */
  hintSeen: boolean;
  createdAt: number;
}

export interface QuestionStat {
  seen: number;
  correct: number;
  wrong: number;
  /** Correct answers since the last miss; a missed question is "learned" again at 2. */
  correctSinceMiss: number;
  lastSeen: number;
}

export interface Progress {
  version: 1;
  questions: Record<string, QuestionStat>;
  stars: number;
  categoryCorrect: Partial<Record<CategoryId, number>>;
  stickers: string[];
  badges: string[];
  streak: { lastDay: string | null; days: number };
  rounds: number;
}

export interface AppSettings {
  parentLang: Lang;
  /** Chosen voiceURI per language; '' = pick the best one automatically. */
  voices: Record<Lang, string>;
  lastProfileId: string | null;
}

export const defaultSettings = (level: Level): ProfileSettings => ({
  speechRate: level === 'little' ? 0.85 : 0.95,
  sound: true,
  categories: [...CATEGORY_IDS],
});

export const emptyProgress = (): Progress => ({
  version: 1,
  questions: {},
  stars: 0,
  categoryCorrect: {},
  stickers: [],
  badges: [],
  streak: { lastDay: null, days: 0 },
  rounds: 0,
});

export async function loadProfiles(): Promise<Profile[]> {
  return (await get<Profile[]>('profiles', store)) ?? [];
}

export async function saveProfiles(profiles: Profile[]) {
  await set('profiles', profiles, store);
}

export async function loadProgress(profileId: string): Promise<Progress> {
  return (await get<Progress>(`progress:${profileId}`, store)) ?? emptyProgress();
}

export async function saveProgress(profileId: string, progress: Progress) {
  await set(`progress:${profileId}`, progress, store);
}

export async function deleteProgress(profileId: string) {
  await del(`progress:${profileId}`, store);
}

export async function loadAppSettings(fallbackLang: Lang): Promise<AppSettings> {
  const s = await get<AppSettings>('app', store);
  return {
    parentLang: fallbackLang,
    voices: { de: '', en: '', it: '' },
    lastProfileId: null,
    ...s,
  };
}

export async function saveAppSettings(s: AppSettings) {
  await set('app', s, store);
}

/** Ask the browser not to evict our data. Returns whether storage is persistent. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
