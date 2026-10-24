/**
 * Validates every /content/<category>.json against the schema and content rules,
 * then writes CONTENT_REVIEW.md listing questions flagged as uncertain.
 * Exits non-zero on any error, so `npm run build` fails on bad content.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CategoryFileSchema, type Question } from '../src/content/schema';
import { CATEGORY_IDS } from '../src/content/categories';
import { generateMaths, questionFromId } from '../src/game/generate';
import { QuestionSchema } from '../src/content/schema';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'content');
const errors: string[] = [];
const all: Question[] = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const category = file.replace(/\.json$/, '');
  if (!(CATEGORY_IDS as readonly string[]).includes(category)) {
    errors.push(`${file}: unknown category "${category}"`);
    continue;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON (${(e as Error).message})`);
    continue;
  }
  const parsed = CategoryFileSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.push(`${file}: ${issue.path.join('.')}: ${issue.message}`);
    continue;
  }
  for (const q of parsed.data) {
    const where = `${file}: ${q.id}`;
    if (q.category !== category) errors.push(`${where}: category "${q.category}" does not match file`);
    errors.push(...ruleErrors(q, where));
    all.push(q);
  }
}

/** Rules beyond the schema, shared by the JSON bank and the maths generator. */
function ruleErrors(q: Question, where: string): string[] {
  const out: string[] = [];
  const correct = q.answers.filter((a) => a.correct).length;
  if (correct !== 1) out.push(`${where}: needs exactly one correct answer, has ${correct}`);
  const answerIds = q.answers.map((a) => a.id);
  if (new Set(answerIds).size !== answerIds.length) out.push(`${where}: duplicate answer ids`);
  if (q.type === 'truefalse') {
    const icons = q.answers.map((a) => a.icon).join('');
    if (q.answers.length !== 2 || icons !== '👍👎') out.push(`${where}: true/false needs answers 👍 then 👎`);
  }
  if (q.type === 'compare' && q.answers.length !== 2) out.push(`${where}: compare needs exactly two answers`);
  if ((q.level === 'big' || q.level === 'both') && (q.type === 'mc' || q.type === 'word') && q.answers.length < 3)
    out.push(`${where}: multiple choice for Big needs 3–4 answers`);
  if (q.type === 'word') {
    if (!q.answerLang || !q.visual) out.push(`${where}: word questions need a picture (visual) and an answerLang`);
    if (!q.forLangs || (q.answerLang && q.forLangs.includes(q.answerLang)))
      out.push(`${where}: word questions need forLangs without their own answerLang`);
  }
  if (q.answerLang) {
    const words = q.answers.map((a) => a.label[q.answerLang!].toLowerCase());
    if (new Set(words).size !== words.length) out.push(`${where}: two answers have the same ${q.answerLang} label`);
  }
  return out;
}

// Generated maths: produce many questions per level and hold them to the same rules,
// and check that every id rebuilds the identical question (needed for spaced repetition).
let generated = 0;
for (const level of ['little', 'big'] as const) {
  for (const q of generateMaths(level, 3000)) {
    generated++;
    const where = `generated ${q.id}`;
    const parsed = QuestionSchema.safeParse(q);
    if (!parsed.success) errors.push(`${where}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    errors.push(...ruleErrors(q, where));
    const again = questionFromId(q.id);
    if (!again || again.answers.find((a) => a.correct)?.id !== q.answers.find((a) => a.correct)?.id || again.prompt.en !== q.prompt.en)
      errors.push(`${where}: cannot be rebuilt from its id`);
    if (q.answers.some((a) => a.correct && Number(a.icon) < 0)) errors.push(`${where}: negative answer`);
  }
}

const seen = new Map<string, number>();
for (const q of all) seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
for (const [id, n] of seen) if (n > 1) errors.push(`duplicate question id "${id}" (${n}×)`);

// ---- report ----
// Coverage as a child experiences it: questions available per level *and* UI language
// (language categories show different questions to native speakers and to learners).
const MIN_PER_LEVEL = 40;
const UI_LANGS = ['de', 'en', 'it'] as const;
const available = (qs: Question[], level: 'little' | 'big', lang: (typeof UI_LANGS)[number]) =>
  qs.filter((q) => (q.level === 'both' || q.level === level) && (!q.forLangs || q.forLangs.includes(lang))).length;
const counts = CATEGORY_IDS.map((c) => {
  const qs = all.filter((q) => q.category === c);
  const per = (level: 'little' | 'big') => UI_LANGS.map((l) => available(qs, level, l));
  return { c, total: qs.length, little: per('little'), big: per('big') };
});
const warnings: string[] = [];
for (const r of counts) {
  if (r.c === 'maths') continue; // maths also has endless generated questions
  (['little', 'big'] as const).forEach((level) =>
    r[level].forEach((n, i) => {
      if (n < MIN_PER_LEVEL) warnings.push(`${r.c}: only ${n} ${level} questions for ${UI_LANGS[i]} speakers (target ${MIN_PER_LEVEL})`);
    }),
  );
}
const fmt = (ns: number[]) => ns.join(' / ');

const flagged = all.filter((q) => q.uncertain);
const md = [
  '# Content review',
  '',
  'Generated by `npm run check-content`. Questions marked `"uncertain"` in the question bank are listed here so a grown-up can double-check them.',
  '',
  '## Coverage',
  '',
  `Questions a child can get, per level and UI language (de / en / it). Target: at least ${MIN_PER_LEVEL} each.`,
  '',
  '| Category | Questions | Little (de / en / it) | Big (de / en / it) |',
  '| --- | ---: | ---: | ---: |',
  ...counts.map((r) => `| ${r.c} | ${r.total}${r.c === 'maths' ? ' + generated' : ''} | ${fmt(r.little)} | ${fmt(r.big)} |`),
  '',
  ...(warnings.length ? ['**Below target:**', '', ...warnings.map((w) => `- ${w}`), ''] : []),
  '## Style notes',
  '',
  '- German follows Swiss spelling: «ss» instead of «ß» (e.g. «gross», «Fuss»). Pronunciation is the same.',
  '- A few Swiss words are used on purpose: Glace (ice cream), Gipfeli (croissant), Znüni (mid-morning snack), Rüebli (carrots), Peperoni (bell peppers).',
  '- The «America» category is mostly about the USA, with some questions about the American continents (Canada, Mexico, the Amazon, the Andes). Prompts always say which.',
  '- Language categories: children who are learning the language get picture-to-word questions; native speakers get letters, rhymes, syllables and grammar instead.',
  '',
  `## Flagged questions (${flagged.length})`,
  '',
  ...(flagged.length
    ? flagged.flatMap((q) => [
        `### \`${q.id}\` (${q.category}, ${q.level})`,
        '',
        `- **Prompt (en):** ${q.prompt.en}`,
        `- **Answer (en):** ${q.answers.find((a) => a.correct)?.label.en ?? '?'}`,
        `- **Fun fact (en):** ${q.funFact.en}`,
        `- **Why flagged:** ${q.uncertain}`,
        '',
      ])
    : ['Nothing flagged.', '']),
].join('\n');
writeFileSync(join(root, 'CONTENT_REVIEW.md'), md);

for (const r of counts)
  if (r.total) console.log(`  ${r.c.padEnd(12)} ${String(r.total).padStart(4)} questions   little ${fmt(r.little).padEnd(14)} big ${fmt(r.big)}`);
console.log(`  ${all.length} questions total, ${flagged.length} flagged for review → CONTENT_REVIEW.md`);
console.log(`  ${generated} generated maths questions checked`);
for (const w of warnings) console.warn(`  ⚠ ${w}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} content error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ content OK');
