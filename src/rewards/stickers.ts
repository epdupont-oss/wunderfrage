import type { Text3 } from '../content/schema';

/** Where the small accessory emoji sits on the sticker. */
export type Corner = 'tl' | 'tr' | 'bl' | 'br';

export interface StickerDef {
  id: string;
  page: number;
  main: string;
  accessory: string;
  corner: Corner;
  name: Text3;
}

export interface StickerPage {
  icon: string;
  colors: string[];
  name: Text3;
}

const tri = (de: string, en: string, it: string): Text3 => ({ de, en, it });

export const STICKER_PAGES: StickerPage[] = [
  { icon: '🐾', colors: ['#ffd6a5', '#fdffb6', '#caffbf', '#ffc6ff'], name: tri('Tierfreunde', 'Animal friends', 'Amici animali') },
  { icon: '🚀', colors: ['#bdb2ff', '#a0c4ff', '#9bf6ff', '#d0bfff'], name: tri('Weltall', 'Space', 'Spazio') },
  { icon: '🍕', colors: ['#ffadad', '#ffd6a5', '#fdffb6', '#ffc8dd'], name: tri('Lecker', 'Yummy', 'Che buono') },
  { icon: '🌻', colors: ['#caffbf', '#d8f3dc', '#fdffb6', '#b7e4c7'], name: tri('Natur', 'Nature', 'Natura') },
  { icon: '🐳', colors: ['#a0c4ff', '#9bf6ff', '#bde0fe', '#cdeffd'], name: tri('Meer', 'Ocean', 'Mare') },
  { icon: '✨', colors: ['#ffc6ff', '#bdb2ff', '#ffd6a5', '#fdffb6'], name: tri('Zauberwelt', 'Magic', 'Magia') },
];

const s = (page: number, id: string, main: string, accessory: string, corner: Corner, name: Text3): StickerDef => ({
  id,
  page,
  main,
  accessory,
  corner,
  name,
});

/** 48 original stickers: each is a picture plus a little accessory. No licensed characters. */
export const STICKERS: StickerDef[] = [
  s(0, 'royal-cat', '🐱', '👑', 'tr', tri('Königskatze', 'Royal cat', 'Gatto reale')),
  s(0, 'winter-fox', '🦊', '🧣', 'br', tri('Winterfuchs', 'Winter fox', 'Volpe d’inverno')),
  s(0, 'rain-frog', '🐸', '☂️', 'tr', tri('Regenfrosch', 'Rain frog', 'Rana della pioggia')),
  s(0, 'carrot-bunny', '🐰', '🥕', 'br', tri('Karottenhase', 'Carrot bunny', 'Coniglio carota')),
  s(0, 'icecream-penguin', '🐧', '🍦', 'br', tri('Glace-Pinguin', 'Ice-cream penguin', 'Pinguino goloso')),
  s(0, 'reading-owl', '🦉', '📚', 'bl', tri('Leseeule', 'Bookworm owl', 'Gufo lettore')),
  s(0, 'rocket-turtle', '🐢', '🚀', 'tr', tri('Raketenschildkröte', 'Rocket turtle', 'Tartaruga razzo')),
  s(0, 'honey-bear', '🐻', '🍯', 'br', tri('Honigbär', 'Honey bear', 'Orso goloso')),

  s(1, 'friendly-alien', '👽', '👋', 'br', tri('Freundliches Alien', 'Friendly alien', 'Alieno amico')),
  s(1, 'star-rocket', '🚀', '✨', 'tl', tri('Sternenrakete', 'Star rocket', 'Razzo stellare')),
  s(1, 'sleepy-moon', '🌙', '💤', 'tr', tri('Schlafmond', 'Sleepy moon', 'Luna dormigliona')),
  s(1, 'ring-planet', '🪐', '💫', 'tr', tri('Ringplanet', 'Ringed planet', 'Pianeta con gli anelli')),
  s(1, 'space-trip', '🧑‍🚀', '⭐', 'tr', tri('Weltraumreise', 'Space trip', 'Viaggio spaziale')),
  s(1, 'cool-sun', '🌞', '🕶️', 'br', tri('Coole Sonne', 'Cool sun', 'Sole alla moda')),
  s(1, 'comet', '☄️', '🌟', 'tl', tri('Komet', 'Comet', 'Cometa')),
  s(1, 'space-cow', '🐮', '🛸', 'tr', tri('Weltraumkuh', 'Space cow', 'Mucca spaziale')),

  s(2, 'favourite-pizza', '🍕', '❤️', 'tr', tri('Lieblingspizza', 'Favourite pizza', 'Pizza del cuore')),
  s(2, 'birthday-cupcake', '🧁', '🕯️', 'tr', tri('Geburtstagstörtchen', 'Birthday cupcake', 'Tortina di compleanno')),
  s(2, 'juicy-melon', '🍉', '😋', 'br', tri('Saftige Melone', 'Juicy melon', 'Anguria succosa')),
  s(2, 'pretzel', '🥨', '🧂', 'br', tri('Brezel', 'Pretzel', 'Brezel')),
  s(2, 'cheese-mouse', '🧀', '🐭', 'br', tri('Käsemaus', 'Cheese mouse', 'Topolino del formaggio')),
  s(2, 'rainbow-doughnut', '🍩', '🌈', 'tr', tri('Regenbogen-Donut', 'Rainbow doughnut', 'Ciambella arcobaleno')),
  s(2, 'sundae', '🍨', '🍒', 'tr', tri('Glacebecher', 'Ice-cream sundae', 'Coppa gelato')),
  s(2, 'spaghetti', '🍝', '🍅', 'br', tri('Spaghetti', 'Spaghetti', 'Spaghetti al pomodoro')),

  s(3, 'sunflower-bee', '🌻', '🐝', 'tr', tri('Sonnenblume', 'Sunflower', 'Girasole')),
  s(3, 'rainbow', '🌈', '☁️', 'bl', tri('Regenbogen', 'Rainbow', 'Arcobaleno')),
  s(3, 'mushroom-house', '🍄', '🐌', 'br', tri('Pilzhaus', 'Mushroom house', 'Casetta fungo')),
  s(3, 'snowman', '⛄', '❄️', 'tr', tri('Schneemann', 'Snowman', 'Pupazzo di neve')),
  s(3, 'apple-tree', '🌳', '🍎', 'br', tri('Apfelbaum', 'Apple tree', 'Melo')),
  s(3, 'spring', '🌷', '🦋', 'tr', tri('Frühling', 'Spring', 'Primavera')),
  s(3, 'mountain-goat', '🏔️', '🐐', 'br', tri('Bergziege', 'Mountain goat', 'Capra di montagna')),
  s(3, 'autumn', '🍁', '🐿️', 'br', tri('Herbst', 'Autumn', 'Autunno')),

  s(4, 'splash-whale', '🐳', '💦', 'tr', tri('Spritzwal', 'Splashing whale', 'Balena che spruzza')),
  s(4, 'painter-octopus', '🐙', '🎨', 'br', tri('Malender Oktopus', 'Painter octopus', 'Polpo pittore')),
  s(4, 'bubble-fish', '🐠', '🫧', 'tr', tri('Blubberfisch', 'Bubble fish', 'Pesce bollicina')),
  s(4, 'beach-crab', '🦀', '🏖️', 'br', tri('Strandkrabbe', 'Beach crab', 'Granchio da spiaggia')),
  s(4, 'wave-dolphin', '🐬', '🌊', 'br', tri('Wellendelfin', 'Wave dolphin', 'Delfino sull’onda')),
  s(4, 'sparkly-shell', '🐚', '✨', 'tr', tri('Glitzermuschel', 'Sparkly shell', 'Conchiglia brillante')),
  s(4, 'ball-seal', '🦭', '⚽', 'tr', tri('Robbe mit Ball', 'Seal with a ball', 'Foca col pallone')),
  s(4, 'sailing-boat', '⛵', '☀️', 'tr', tri('Segelboot', 'Sailing boat', 'Barca a vela')),

  s(5, 'rainbow-unicorn', '🦄', '🌈', 'br', tri('Regenbogen-Einhorn', 'Rainbow unicorn', 'Unicorno arcobaleno')),
  s(5, 'party-dragon', '🐲', '🎈', 'tr', tri('Partydrache', 'Party dragon', 'Draghetto festoso')),
  s(5, 'castle', '🏰', '🚩', 'tr', tri('Schloss', 'Castle', 'Castello')),
  s(5, 'helper-robot', '🤖', '🔧', 'br', tri('Helfer-Roboter', 'Helper robot', 'Robot aiutante')),
  s(5, 'balloon-teddy', '🧸', '🎈', 'tr', tri('Ballon-Teddy', 'Balloon teddy', 'Orsetto col palloncino')),
  s(5, 'magic-hat', '🎩', '🐇', 'tr', tri('Zauberhut', 'Magic hat', 'Cappello magico')),
  s(5, 'steam-train', '🚂', '💨', 'tl', tri('Dampflok', 'Steam train', 'Treno a vapore')),
  s(5, 'superstar', '🏆', '🌟', 'tr', tri('Superstar', 'Superstar', 'Superstella')),
];

export const stickerById = (id: string) => STICKERS.find((x) => x.id === id);

export function stickerColor(st: StickerDef): string {
  const page = STICKER_PAGES[st.page];
  const idx = STICKERS.filter((x) => x.page === st.page).indexOf(st);
  return page.colors[idx % page.colors.length];
}
