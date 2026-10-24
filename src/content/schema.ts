import { z } from 'zod';
import { CATEGORY_IDS } from './categories';

const Lang = z.enum(['de', 'en', 'it']);

const Text3 = z.strictObject({
  de: z.string().trim().min(1),
  en: z.string().trim().min(1),
  it: z.string().trim().min(1),
});

export const AnswerSchema = z.strictObject({
  id: z.string().min(1),
  /** Emoji (or emoji composition) shown on the answer card. */
  icon: z.string().min(1),
  label: Text3,
  correct: z.boolean(),
});

export const QuestionSchema = z.strictObject({
  id: z.string().regex(/^[a-z]+-[a-z0-9-]+$/, 'ids look like "animals-cow-moo"'),
  category: z.enum(CATEGORY_IDS),
  level: z.enum(['little', 'big', 'both']),
  type: z.enum(['mc', 'truefalse', 'compare', 'count', 'math', 'word']),
  prompt: Text3,
  /**
   * Optional picture shown with the question. Emoji are laid out so they can be counted;
   * "🔴🔴+🔵" shows two groups; text such as "7 × 8" or "M" is shown as big text.
   */
  visual: z.string().optional(),
  /** Answers are shown and spoken in this language instead of the child's (language categories). */
  answerLang: Lang.optional(),
  /** Only asked to children whose UI language is listed (e.g. "what is this in Italian?" is not for Italian speakers). */
  forLangs: z.array(Lang).min(1).optional(),
  answers: z.array(AnswerSchema).min(2).max(4),
  explanation: Text3,
  funFact: Text3,
  tags: z.array(z.string()),
  /** Set when a fact should be double-checked by a grown-up; listed in CONTENT_REVIEW.md. */
  uncertain: z.string().optional(),
});

export const CategoryFileSchema = z.array(QuestionSchema);

export type Answer = z.infer<typeof AnswerSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Text3 = z.infer<typeof Text3>;
