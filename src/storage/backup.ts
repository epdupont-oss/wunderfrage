/**
 * Backup files: all profiles and their progress in one JSON file, for safekeeping and
 * for moving between devices (e.g. iPad → iPhone). Loading a backup *combines* it with
 * what is already on the device, so nothing is ever lost.
 */
import {
  emptyProgress,
  loadProfiles,
  loadProgress,
  saveProfiles,
  saveProgress,
  type Profile,
  type Progress,
  type QuestionStat,
} from './db';

export interface Backup {
  app: 'wunderfrage';
  version: 1;
  exportedAt: string;
  profiles: Profile[];
  progress: Record<string, Progress>;
}

export async function createBackup(): Promise<Backup> {
  const profiles = await loadProfiles();
  const progress: Record<string, Progress> = {};
  for (const p of profiles) progress[p.id] = await loadProgress(p.id);
  return { app: 'wunderfrage', version: 1, exportedAt: new Date().toISOString(), profiles, progress };
}

export class BackupFormatError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parse and sanity-check a backup file. Throws BackupFormatError if it isn't one of ours. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupFormatError('not JSON');
  }
  if (!isObj(data) || data.app !== 'wunderfrage' || data.version !== 1 || !Array.isArray(data.profiles) || !isObj(data.progress))
    throw new BackupFormatError('not a Wunderfrage backup');
  for (const p of data.profiles) {
    if (!isObj(p) || typeof p.id !== 'string' || typeof p.name !== 'string' || !isObj(p.settings))
      throw new BackupFormatError('bad profile');
  }
  return data as unknown as Backup;
}

/** Fill in fields an older or hand-edited backup might lack. */
const normalise = (p: Partial<Progress> | undefined): Progress => ({ ...emptyProgress(), ...p });

const mergeStat = (a: QuestionStat, b: QuestionStat): QuestionStat => {
  const latest = a.lastSeen >= b.lastSeen ? a : b;
  return {
    seen: Math.max(a.seen, b.seen),
    correct: Math.max(a.correct, b.correct),
    wrong: Math.max(a.wrong, b.wrong),
    correctSinceMiss: latest.correctSinceMiss,
    lastSeen: latest.lastSeen,
  };
};

/**
 * Combine two progress records without losing anything: stickers and badges are joined,
 * counters take the higher value. (Taking the higher value rather than the sum means
 * loading the same backup twice never inflates stars.)
 */
export function mergeProgress(local: Progress, incoming: Progress): Progress {
  const a = normalise(local);
  const b = normalise(incoming);
  const questions = { ...a.questions };
  for (const [id, stat] of Object.entries(b.questions)) questions[id] = questions[id] ? mergeStat(questions[id], stat) : stat;
  const categoryCorrect = { ...a.categoryCorrect };
  for (const [c, n] of Object.entries(b.categoryCorrect) as [keyof Progress['categoryCorrect'], number][])
    categoryCorrect[c] = Math.max(categoryCorrect[c] ?? 0, n);
  const later = (a.streak.lastDay ?? '') >= (b.streak.lastDay ?? '') ? a.streak : b.streak;
  return {
    version: 1,
    questions,
    stars: Math.max(a.stars, b.stars),
    categoryCorrect,
    stickers: [...a.stickers, ...b.stickers.filter((s) => !a.stickers.includes(s))],
    badges: [...a.badges, ...b.badges.filter((s) => !a.badges.includes(s))],
    streak: { lastDay: later.lastDay, days: Math.max(a.streak.days, b.streak.days) },
    rounds: Math.max(a.rounds, b.rounds),
  };
}

/** Load a backup into this device. Returns the new profile list and what happened. */
export async function importBackup(backup: Backup): Promise<{ profiles: Profile[]; added: number; merged: number }> {
  const profiles = await loadProfiles();
  let added = 0;
  let merged = 0;
  for (const incoming of backup.profiles) {
    const local = profiles.find((p) => p.id === incoming.id);
    const incomingProgress = normalise(backup.progress[incoming.id]);
    if (local) {
      // Same child on both devices: keep this device's settings, combine the progress.
      await saveProgress(local.id, mergeProgress(await loadProgress(local.id), incomingProgress));
      merged++;
    } else {
      profiles.push(incoming);
      await saveProgress(incoming.id, incomingProgress);
      added++;
    }
  }
  await saveProfiles(profiles);
  return { profiles, added, merged };
}

export const backupFileName = (d = new Date()) => `wunderfrage-backup-${d.toISOString().slice(0, 10)}.json`;

/**
 * Hand the backup file to the user. On iPhone/iPad this opens the share sheet
 * (AirDrop, Save to Files, …); elsewhere the file is downloaded.
 * Returns false if the user cancelled the share sheet.
 */
export async function saveBackupFile(backup: Backup): Promise<boolean> {
  const name = backupFileName();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Wunderfrage' });
      return true;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return false;
      // NotAllowedError etc.: fall back to a normal download below.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
