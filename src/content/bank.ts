import type { Question } from './schema';
import type { CategoryId } from './categories';

// One lazily loaded chunk per category; the service worker precaches them all for offline use.
const files = import.meta.glob<Question[]>('/content/*.json', { import: 'default' });

const pathFor = (id: CategoryId) => `/content/${id}.json`;
const cache = new Map<CategoryId, Question[]>();

// Maths always has content: most of its questions are generated.
export const hasContent = (id: CategoryId) => id === 'maths' || pathFor(id) in files;

export async function loadCategory(id: CategoryId): Promise<Question[]> {
  const hit = cache.get(id);
  if (hit) return hit;
  const loader = files[pathFor(id)];
  const questions = loader ? await loader() : [];
  cache.set(id, questions);
  return questions;
}

export async function loadCategories(ids: CategoryId[]): Promise<Question[]> {
  return (await Promise.all(ids.filter(hasContent).map(loadCategory))).flat();
}
