import { Fragment } from 'preact';

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter() : null;

/** Split into user-perceived characters, so "❤️" or "👍🏽" stay whole. */
export function graphemes(s: string): string[] {
  return segmenter ? [...segmenter.segment(s)].map((x) => x.segment) : Array.from(s);
}

export const isText = (s: string) => /[\p{L}\p{N}]/u.test(s);

function Group({ items }: { items: string[] }) {
  // Rows of five, like a ten-frame, so small children can count them.
  return (
    <span class="pics-group" style={{ gridTemplateColumns: `repeat(${Math.min(5, items.length)}, auto)` }}>
      {items.map((g, i) => (
        <span key={i} class="pic">
          {g}
        </span>
      ))}
    </span>
  );
}

/**
 * Renders a question visual or answer icon:
 * - text with letters/digits ("7 × 8", "M", "12") → big text
 * - one or two emoji → a big picture
 * - more emoji → a countable grid; "🔴🔴+🔵" shows two groups with a plus between
 * Pass `grid` to force the grid (same item size) when cards are compared with each other.
 */
export function Pictures({ value, class: cls = '', grid = false }: { value: string; class?: string; grid?: boolean }) {
  if (isText(value)) {
    // Longer words get smaller so they fit on a card ("libri" vs "Schnee + Mann").
    const n = value.length;
    const scale = n <= 4 ? 1 : n <= 7 ? 0.8 : n <= 10 ? 0.62 : 0.5;
    return (
      <span class={`${cls} pics-text`} style={{ '--text-scale': scale }}>
        {value}
      </span>
    );
  }
  const groups = value.split('+').map((g) => graphemes(g.trim()).filter((x) => x.trim()));
  if (!grid && groups.length === 1 && groups[0].length <= 2) return <span class={cls}>{value}</span>;
  const total = groups.reduce((n, g) => n + g.length, 0);
  // With `grid`, every item has the same size whatever the count, so 1 never looks "bigger" than 4.
  return (
    <span class={`${cls} pics${grid || total > 3 ? ' many' : ''}`}>
      {groups.map((g, i) => (
        <Fragment key={i}>
          {i > 0 && <span class="pics-plus">+</span>}
          <Group items={g} />
        </Fragment>
      ))}
    </span>
  );
}
