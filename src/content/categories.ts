export const CATEGORY_IDS = [
  'animals',
  'science',
  'maths',
  'deutsch',
  'italiano',
  'switzerland',
  'italy',
  'america',
  'body',
  'space',
  'nature',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryMeta {
  id: CategoryId | 'surprise';
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'animals', icon: '🦁', color: '#f4a259' },
  { id: 'science', icon: '🔬', color: '#5bb8c4' },
  { id: 'maths', icon: '🔢', color: '#8e7dd8' },
  { id: 'deutsch', icon: '🥨', color: '#e86f68' },
  { id: 'italiano', icon: '🍝', color: '#5cb87a' },
  { id: 'switzerland', icon: '🇨🇭', color: '#e25b5b' },
  { id: 'italy', icon: '🇮🇹', color: '#4fae6e' },
  { id: 'america', icon: '🗽', color: '#5a8fd8' },
  { id: 'body', icon: '🖐️', color: '#f08bb0' },
  { id: 'space', icon: '🚀', color: '#4a5aa8' },
  { id: 'nature', icon: '🌳', color: '#7bbf5a' },
];

export const SURPRISE: CategoryMeta = { id: 'surprise', icon: '🎁', color: '#f2c14e' };
