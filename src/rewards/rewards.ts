import { CATEGORY_IDS, type CategoryId } from '../content/categories';
import type { Level, Progress } from '../storage/db';
import { STICKERS } from './stickers';

/** Stars needed per sticker: with typical scores, about one sticker every two rounds. */
export const STICKER_COST: Record<Level, number> = { little: 7, big: 12 };

/** Explorer badge milestones: correct answers in one category. */
export const BADGE_TIERS = [10, 25, 50, 100] as const;
export type BadgeTier = (typeof BADGE_TIERS)[number];

/** Days played needed for each plant stage. The plant only ever grows. */
export const PLANT_STAGES = [0, 1, 2, 4, 7, 11, 16, 24, 35] as const;

export const badgeId = (category: CategoryId, tier: BadgeTier) => `${category}-${tier}`;

export function plantStage(days: number): number {
  let stage = 0;
  PLANT_STAGES.forEach((d, i) => {
    if (days >= d) stage = i;
  });
  return stage;
}

/** Stars still needed for the next sticker (0 when every sticker is collected). */
export function starsToNextSticker(progress: Progress, level: Level): number {
  if (progress.stickers.length >= STICKERS.length) return 0;
  const cost = STICKER_COST[level];
  return cost - (progress.stars % cost);
}

/** The next badge milestone for a category and how far along it is (0–1). */
export function badgeProgress(correct: number): { next: BadgeTier | null; fraction: number; best: BadgeTier | null } {
  let prev = 0;
  let best: BadgeTier | null = null;
  for (const tier of BADGE_TIERS) {
    if (correct < tier) return { next: tier, fraction: (correct - prev) / (tier - prev), best };
    prev = tier;
    best = tier;
  }
  return { next: null, fraction: 1, best };
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type Reward =
  | { kind: 'sticker'; id: string }
  | { kind: 'badge'; category: CategoryId; tier: BadgeTier }
  | { kind: 'plant'; days: number; grew: boolean };

/**
 * Hand out everything earned so far: stickers for stars, badges for milestones, and
 * one plant "watering" per day played. Called when a round ends. Catches up on anything
 * missed earlier (e.g. stars from a round that was stopped halfway).
 */
export function collectRewards(progress: Progress, level: Level, today = todayKey()): { progress: Progress; rewards: Reward[] } {
  const rewards: Reward[] = [];
  const stickers = [...progress.stickers];
  const target = Math.floor(progress.stars / STICKER_COST[level]);
  const remaining = STICKERS.filter((st) => !stickers.includes(st.id));
  while (stickers.length < target && remaining.length) {
    const [st] = remaining.splice(Math.floor(Math.random() * remaining.length), 1);
    stickers.push(st.id);
    rewards.push({ kind: 'sticker', id: st.id });
  }

  const badges = [...progress.badges];
  for (const category of CATEGORY_IDS) {
    const correct = progress.categoryCorrect[category] ?? 0;
    for (const tier of BADGE_TIERS) {
      const id = badgeId(category, tier);
      if (correct >= tier && !badges.includes(id)) {
        badges.push(id);
        rewards.push({ kind: 'badge', category, tier });
      }
    }
  }

  let streak = progress.streak;
  if (streak.lastDay !== today) {
    const days = streak.days + 1;
    rewards.push({ kind: 'plant', days, grew: plantStage(days) > plantStage(streak.days) });
    streak = { lastDay: today, days };
  }

  return { progress: { ...progress, stickers, badges, streak }, rewards };
}
