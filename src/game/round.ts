import type { Answer, Question } from '../content/schema';
import type { Lang } from '../i18n';
import type { Level, Progress, QuestionStat } from '../storage/db';
import { shuffle } from './shuffle';
import { generateMaths, questionFromId } from './generate';

export const ROUND_SIZE: Record<Level, number> = { little: 6, big: 10 };

export interface RoundQuestion {
  question: Question;
  /** Answers to show, already shuffled and trimmed for the level. */
  options: Answer[];
}

/**
 * Simple spaced repetition: a missed question keeps a high weight until it has been
 * answered correctly twice since the miss. New questions come next; mastered ones least.
 */
export function weightOf(stat: QuestionStat | undefined): number {
  if (!stat || stat.seen === 0) return 4;
  if (stat.wrong > 0 && stat.correctSinceMiss < 2) return 8;
  return 1;
}

function weightedSample<T>(items: T[], weight: (t: T) => number, n: number): T[] {
  const pool = items.map((item) => ({ item, w: weight(item) }));
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    const idx = pool.findIndex((p) => (r -= p.w) < 0);
    out.push(pool.splice(idx < 0 ? pool.length - 1 : idx, 1)[0].item);
  }
  return out;
}

function optionsFor(q: Question, level: Level): Answer[] {
  // True/false keeps 👍 then 👎 so the thumbs are always in the same place.
  if (q.type === 'truefalse') return q.answers;
  if (level === 'big' || q.answers.length <= 2) return shuffle(q.answers);
  // Little: the correct answer plus one random distractor.
  const correct = q.answers.find((a) => a.correct)!;
  const wrong = shuffle(q.answers.filter((a) => !a.correct))[0];
  return shuffle([correct, wrong]);
}

/**
 * Generated maths questions for a round: a fresh batch plus every generated question
 * the child missed and has not yet answered correctly twice.
 */
export function mathsPool(level: Level, progress: Progress): Question[] {
  const missed = Object.entries(progress.questions)
    .filter(([id, stat]) => id.startsWith('maths-gen-') && weightOf(stat) > 4)
    .map(([id]) => questionFromId(id))
    .filter((q): q is Question => !!q && q.level === level);
  const fresh = generateMaths(level, 24).filter((q) => !progress.questions[q.id]);
  return [...missed, ...fresh];
}

export function buildRound(all: Question[], level: Level, lang: Lang, progress: Progress): RoundQuestion[] {
  const eligible = all.filter(
    (q) => (q.level === 'both' || q.level === level) && (!q.forLangs || q.forLangs.includes(lang)),
  );
  // In a mix, every category gets the same total weight, however many questions it has
  // (otherwise the endless generated maths would crowd out everything else).
  const perCategory = new Map<string, number>();
  for (const q of eligible) perCategory.set(q.category, (perCategory.get(q.category) ?? 0) + 1);
  const share = (q: Question) => 1 / perCategory.get(q.category)!;
  const size = ROUND_SIZE[level];
  // Missed questions come back, but fill at most a third of a round so it never feels like a re-test.
  const isMissed = (q: Question) => weightOf(progress.questions[q.id]) > 4;
  const missed = weightedSample(eligible.filter(isMissed), share, Math.ceil(size / 3));
  const rest = weightedSample(
    eligible.filter((q) => !isMissed(q)),
    (q) => weightOf(progress.questions[q.id]) * share(q),
    size - missed.length,
  );
  // Small categories: top up with more missed questions rather than playing a short round.
  const extra = weightedSample(
    eligible.filter((q) => isMissed(q) && !missed.includes(q)),
    share,
    size - missed.length - rest.length,
  );
  const picked = shuffle([...missed, ...rest, ...extra]);
  return picked.map((question) => ({ question, options: optionsFor(question, level) }));
}

export function recordAnswer(progress: Progress, q: Question, correct: boolean): Progress {
  const prev = progress.questions[q.id] ?? { seen: 0, correct: 0, wrong: 0, correctSinceMiss: 0, lastSeen: 0 };
  const stat: QuestionStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    correctSinceMiss: correct ? prev.correctSinceMiss + 1 : 0,
    lastSeen: Date.now(),
  };
  return {
    ...progress,
    questions: { ...progress.questions, [q.id]: stat },
    stars: progress.stars + (correct ? 1 : 0),
    categoryCorrect: correct
      ? { ...progress.categoryCorrect, [q.category]: (progress.categoryCorrect[q.category] ?? 0) + 1 }
      : progress.categoryCorrect,
  };
}
