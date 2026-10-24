/**
 * Generated maths questions. Each question's id encodes everything needed to rebuild it
 * (e.g. "maths-gen-mul-7-8"), so missed questions can come back in later rounds.
 *
 * Little: counting pictures, adding dots up to 10, "where are there more?".
 * Big:    + and − up to 100, times tables up to 10 × 10.
 */
import type { Answer, Question, Text3 } from '../content/schema';
import type { Level } from '../storage/db';
import { shuffle } from './shuffle';

const tri = (de: string, en: string, it: string): Text3 => ({ de, en, it });
const fill = (t: Text3, v: Record<string, string | number>): Text3 => {
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
  return { de: f(t.de), en: f(t.en), it: f(t.it) };
};
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const repeat = (icon: string, n: number) => Array.from({ length: n }, () => icon).join('');

interface Thing {
  id: string;
  icon: string;
  name: Text3;
  /** Italian "how many" agrees with the noun's gender. */
  itHowMany: 'Quanti' | 'Quante';
}

const THINGS: Thing[] = [
  { id: 'apple', icon: '🍎', name: tri('Äpfel', 'apples', 'mele'), itHowMany: 'Quante' },
  { id: 'star', icon: '⭐', name: tri('Sterne', 'stars', 'stelle'), itHowMany: 'Quante' },
  { id: 'duck', icon: '🦆', name: tri('Enten', 'ducks', 'anatre'), itHowMany: 'Quante' },
  { id: 'flower', icon: '🌼', name: tri('Blumen', 'flowers', 'fiori'), itHowMany: 'Quanti' },
  { id: 'fish', icon: '🐟', name: tri('Fische', 'fish', 'pesci'), itHowMany: 'Quanti' },
  { id: 'car', icon: '🚗', name: tri('Autos', 'cars', 'macchine'), itHowMany: 'Quante' },
  { id: 'balloon', icon: '🎈', name: tri('Ballons', 'balloons', 'palloncini'), itHowMany: 'Quanti' },
  { id: 'strawberry', icon: '🍓', name: tri('Erdbeeren', 'strawberries', 'fragole'), itHowMany: 'Quante' },
  { id: 'ladybird', icon: '🐞', name: tri('Marienkäfer', 'ladybirds', 'coccinelle'), itHowMany: 'Quante' },
  { id: 'cupcake', icon: '🧁', name: tri('Törtchen', 'cupcakes', 'tortine'), itHowMany: 'Quante' },
];
const thing = (id: string) => THINGS.find((t) => t.id === id);

const LITTLE_FACTS: Text3[] = [
  tri(
    'Wir zählen in Zehnern, weil wir zehn Finger haben.',
    'We count in tens because we have ten fingers.',
    'Contiamo a gruppi di dieci perché abbiamo dieci dita.',
  ),
  tri(
    'Beim Plus darfst du die Zahlen tauschen: 2 plus 3 ist gleich viel wie 3 plus 2.',
    'When you add, you can swap the numbers: 2 plus 3 is the same as 3 plus 2.',
    'Nell’addizione puoi scambiare i numeri: 2 più 3 fa come 3 più 2.',
  ),
  tri(
    'Es gibt keine grösste Zahl. Du kannst immer noch eins dazuzählen!',
    'There is no biggest number. You can always add one more!',
    'Non esiste un numero più grande di tutti. Puoi sempre aggiungere uno!',
  ),
  tri(
    'Eine Hand hat fünf Finger. Zwei Hände haben zusammen zehn.',
    'One hand has five fingers. Two hands have ten together.',
    'Una mano ha cinque dita. Due mani ne hanno dieci in tutto.',
  ),
  tri(
    'Ein Würfel hat sechs Seiten mit eins bis sechs Punkten.',
    'A dice has six sides with one to six dots.',
    'Un dado ha sei facce, con i puntini da uno a sei.',
  ),
  tri(
    'Gerade Zahlen kann man gerecht zwischen zwei Freunden teilen.',
    'Even numbers can be shared fairly between two friends.',
    'I numeri pari si possono dividere in modo giusto tra due amici.',
  ),
];

/** Up to `n` distinct wrong answers near `correct`, within [min, max]. */
function distractors(correct: number, candidates: number[], n: number, min: number, max: number): number[] {
  const out: number[] = [];
  for (const c of shuffle(candidates)) {
    if (c !== correct && c >= min && c <= max && !out.includes(c)) out.push(c);
    if (out.length === n) break;
  }
  // Fill up with nearby numbers if the candidates were not enough.
  for (let d = 1; out.length < n; d++) {
    for (const c of [correct + d, correct - d]) if (c >= min && c <= max && c !== correct && !out.includes(c) && out.length < n) out.push(c);
  }
  return out;
}

const numberAnswers = (correct: number, wrong: number[]): Answer[] =>
  [correct, ...wrong].map((n) => ({
    id: `n${n}`,
    icon: String(n),
    label: tri(String(n), String(n), String(n)),
    correct: n === correct,
  }));

const base = (id: string, level: 'little' | 'big', type: Question['type'], tags: string[]) => ({
  id,
  category: 'maths' as const,
  level,
  type,
  tags: ['generated', ...tags],
});

// ---- Little --------------------------------------------------------------

function count(t: Thing, n: number): Question {
  return {
    ...base(`maths-gen-count-${t.id}-${n}`, 'little', 'count', ['counting']),
    visual: repeat(t.icon, n),
    prompt: {
      de: `Wie viele ${t.name.de} siehst du?`,
      en: `How many ${t.name.en} can you see?`,
      it: `${t.itHowMany} ${t.name.it} vedi?`,
    },
    answers: numberAnswers(n, distractors(n, [n - 1, n + 1, n - 2, n + 2], 2, 1, 10)),
    explanation: fill(tri('Es sind {n} {de}.', 'There are {n} {en}.', 'Ci sono {n} {it}.'), { n, ...t.name }),
    funFact: LITTLE_FACTS[n % LITTLE_FACTS.length],
  };
}

function dots(a: number, b: number): Question {
  const c = a + b;
  return {
    ...base(`maths-gen-dots-${a}-${b}`, 'little', 'math', ['adding']),
    visual: `${repeat('🔴', a)}+${repeat('🔵', b)}`,
    prompt: tri(
      'Wie viele Punkte sind es zusammen?',
      'How many dots are there altogether?',
      'Quanti pallini ci sono in tutto?',
    ),
    answers: numberAnswers(c, distractors(c, [c - 1, c + 1, a, b], 2, 1, 10)),
    explanation: fill(tri('{a} plus {b} ist {c}.', '{a} plus {b} makes {c}.', '{a} più {b} fa {c}.'), { a, b, c }),
    funFact: LITTLE_FACTS[(a + b * 3) % LITTLE_FACTS.length],
  };
}

function more(t: Thing, a: number, b: number): Question {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return {
    ...base(`maths-gen-more-${t.id}-${a}-${b}`, 'little', 'compare', ['comparing']),
    prompt: {
      de: `Wo sind mehr ${t.name.de}?`,
      en: `Where are there more ${t.name.en}?`,
      it: `Dove ci sono più ${t.name.it}?`,
    },
    answers: [a, b].map((n, i) => ({
      id: i === 0 ? 'left' : 'right',
      icon: repeat(t.icon, n),
      label: tri(String(n), String(n), String(n)),
      correct: n === big,
    })),
    explanation: fill(tri('{big} ist mehr als {small}.', '{big} is more than {small}.', '{big} è più di {small}.'), {
      big,
      small,
    }),
    funFact: LITTLE_FACTS[(a * 7 + b) % LITTLE_FACTS.length],
  };
}

// ---- Big ------------------------------------------------------------------

function add(a: number, b: number): Question {
  const c = a + b;
  return {
    ...base(`maths-gen-add-${a}-${b}`, 'big', 'math', ['adding']),
    visual: `${a} + ${b}`,
    prompt: fill(tri('Wie viel ist {a} plus {b}?', 'What is {a} plus {b}?', 'Quanto fa {a} più {b}?'), { a, b }),
    answers: numberAnswers(c, distractors(c, [c + 1, c - 1, c + 10, c - 10, c + 2], 3, 0, 110)),
    explanation: fill(tri('{a} plus {b} ist {c}.', '{a} plus {b} is {c}.', '{a} più {b} fa {c}.'), { a, b, c }),
    funFact: fill(
      tri('Zur Probe: {c} minus {b} gibt wieder {a}!', 'To check: {c} minus {b} gives {a} again!', 'Per controllare: {c} meno {b} fa di nuovo {a}!'),
      { a, b, c },
    ),
  };
}

function sub(a: number, b: number): Question {
  const c = a - b;
  return {
    ...base(`maths-gen-sub-${a}-${b}`, 'big', 'math', ['subtracting']),
    visual: `${a} − ${b}`,
    prompt: fill(tri('Wie viel ist {a} minus {b}?', 'What is {a} minus {b}?', 'Quanto fa {a} meno {b}?'), { a, b }),
    answers: numberAnswers(c, distractors(c, [c + 1, c - 1, c + 10, c - 10, c + 2], 3, 0, 100)),
    explanation: fill(tri('{a} minus {b} ist {c}.', '{a} minus {b} is {c}.', '{a} meno {b} fa {c}.'), { a, b, c }),
    funFact: fill(
      tri('Zur Probe: {c} plus {b} gibt wieder {a}!', 'To check: {c} plus {b} gives {a} again!', 'Per controllare: {c} più {b} fa di nuovo {a}!'),
      { a, b, c },
    ),
  };
}

function mulFact(a: number, b: number): Text3 {
  if (a === 10 || b === 10)
    return tri(
      'Mal 10 ist einfach: Hänge an die andere Zahl eine Null an!',
      'Times 10 is easy: just put a zero after the other number!',
      'Per 10 è facile: aggiungi uno zero dopo l’altro numero!',
    );
  if (a === 1 || b === 1)
    return tri('Mal 1 bleibt jede Zahl gleich.', 'Any number times 1 stays the same.', 'Ogni numero per 1 resta uguale.');
  if (a === b)
    return tri(
      'Eine Zahl mal sich selbst nennt man Quadratzahl. Man kann sie als Quadrat aus Punkten legen!',
      'A number times itself is called a square number. You can lay it out as a square of dots!',
      'Un numero moltiplicato per sé stesso si chiama quadrato. Puoi disegnarlo come un quadrato di puntini!',
    );
  return fill(
    tri('{a} mal {b} ist gleich viel wie {b} mal {a}.', '{a} times {b} is the same as {b} times {a}.', '{a} per {b} fa come {b} per {a}.'),
    { a, b },
  );
}

function mul(a: number, b: number): Question {
  const c = a * b;
  return {
    ...base(`maths-gen-mul-${a}-${b}`, 'big', 'math', ['times-tables']),
    visual: `${a} × ${b}`,
    prompt: fill(tri('Wie viel ist {a} mal {b}?', 'What is {a} times {b}?', 'Quanto fa {a} per {b}?'), { a, b }),
    answers: numberAnswers(c, distractors(c, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, c + 1, c - 1], 3, 0, 110)),
    explanation: fill(tri('{a} mal {b} ist {c}.', '{a} times {b} is {c}.', '{a} per {b} fa {c}.'), { a, b, c }),
    funFact: mulFact(a, b),
  };
}

// ---- random generation and rebuilding by id -------------------------------

function randomLittle(): Question {
  const t = THINGS[rand(0, THINGS.length - 1)];
  switch (rand(0, 2)) {
    case 0:
      return count(t, rand(2, 10));
    case 1: {
      const a = rand(1, 5);
      return dots(a, rand(1, Math.min(5, 10 - a)));
    }
    default: {
      // Differ by at least 2 so the difference can be seen at a glance.
      const a = rand(1, 6);
      const b = Math.random() < 0.5 ? a + rand(2, 3) : Math.max(1, a - rand(2, 3));
      return a === b ? more(t, a, a + 2) : more(t, a, b);
    }
  }
}

function randomBig(): Question {
  switch (rand(0, 2)) {
    case 0: {
      const c = rand(20, 100);
      const a = rand(5, c - 5);
      return add(a, c - a);
    }
    case 1: {
      const a = rand(15, 100);
      return sub(a, rand(3, a - 1));
    }
    default:
      return mul(rand(2, 10), rand(2, 10));
  }
}

export function generateMaths(level: Level, n: number): Question[] {
  const out = new Map<string, Question>();
  for (let tries = 0; out.size < n && tries < n * 5; tries++) {
    const q = level === 'little' ? randomLittle() : randomBig();
    out.set(q.id, q);
  }
  return [...out.values()];
}

/** Rebuild a generated question from its id, or null if the id is not a generated one. */
export function questionFromId(id: string): Question | null {
  const m = id.match(/^maths-gen-([a-z]+)-(.+)$/);
  if (!m) return null;
  const parts = m[2].split('-');
  const nums = parts.map(Number);
  switch (m[1]) {
    case 'count': {
      const t = thing(parts[0]);
      return t ? count(t, nums[1]) : null;
    }
    case 'more': {
      const t = thing(parts[0]);
      return t ? more(t, nums[1], nums[2]) : null;
    }
    case 'dots':
      return dots(nums[0], nums[1]);
    case 'add':
      return add(nums[0], nums[1]);
    case 'sub':
      return sub(nums[0], nums[1]);
    case 'mul':
      return mul(nums[0], nums[1]);
  }
  return null;
}
