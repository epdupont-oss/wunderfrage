import de from './de.json';
import en from './en.json';
import it from './it.json';

export type Lang = 'de' | 'en' | 'it';
export const LANGS: Lang[] = ['de', 'en', 'it'];
/** Language names are always shown in their own language. */
export const LANG_NAMES: Record<Lang, string> = { de: 'Deutsch', en: 'English', it: 'Italiano' };

type Dict = typeof en;
const DICTS: Record<Lang, Dict> = { de, en, it };

// Dotted keys of string leaves ("quiz.next") and of string-array leaves ("feedback.praise").
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
type ListLeaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly string[]
    ? `${P}${K}`
    : T[K] extends string
      ? never
      : ListLeaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Leaves<Dict>;
export type TListKey = ListLeaves<Dict>;

function lookup(lang: Lang, key: string): unknown {
  const walk = (d: unknown) =>
    key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], d);
  return walk(DICTS[lang]) ?? walk(DICTS.en);
}

function fill(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}

export function t(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  const s = lookup(lang, key);
  return typeof s === 'string' ? fill(s, vars) : key;
}

/** A random entry from a string list, e.g. one of the ~20 praise lines. */
export function pick(lang: Lang, key: TListKey, vars?: Record<string, string | number>): string {
  const list = lookup(lang, key) as string[];
  return fill(list[Math.floor(Math.random() * list.length)], vars);
}

export function deviceLang(): Lang {
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.slice(0, 2).toLowerCase();
    if ((LANGS as string[]).includes(base)) return base as Lang;
  }
  return 'de';
}
