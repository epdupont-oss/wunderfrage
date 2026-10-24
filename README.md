# Wunderfrage

A talking quiz game for curious kids (about 5 and 8 years old), in German, English and Italian.
Everything is read aloud and every answer has a picture, so children who can't read yet can play on their own.
No ads, no accounts, no tracking. After the first visit it works fully offline.

**Live app:** https://epdupont-oss.github.io/wunderfrage/

## Install on iPad and iPhone

1. Open the link above in **Safari**.
2. Tap ▶ and wait a moment – the whole app and all questions are downloaded in the background.
3. Tap **Share → Add to Home Screen**.
4. Start Wunderfrage from the Home Screen. It now works in flight mode, and iOS keeps its data safe
   (a website that is only opened in Safari may have its data cleared after some weeks of not being used).

For much nicer speech, download better voices on each device:
**Settings → Accessibility → Spoken Content → Voices → German / Italian / English → an “Enhanced” or “Premium” voice**.
Then fully close and reopen the app. The parent area shows which voice is used and lets you pick another one.

## For parents

Hold the ⚙️ button (below the topics) for 3 seconds, then answer the maths question. In the parent area you can:

- add, edit or delete children: name, character, level (Little ≈ 5, Big ≈ 8), language
- set each child's speaking speed and sound effects, and which topics they see
- choose the voice for each language
- reset a child's progress
- **save or load a backup** (see below)

### Moving progress between devices (backup)

Progress is stored on each device separately. To move it, or to keep a copy:

1. On the first device: parent area → **Save backup**. On iPhone/iPad the share sheet opens: send the file with
   **AirDrop** to the other device, or **Save to Files**.
2. On the other device: parent area → **Load backup**, and choose the file. On a brand-new device the
   **Load backup** button is right on the welcome screen.

Loading a backup **combines** it with what is already there: stickers and badges are joined, stars and counters keep
the higher value, and nothing is deleted. Loading the same file twice changes nothing. (Because the two devices are
combined rather than added up, a child who plays on both devices keeps the better of the two star counts.)

## How the game works

- **Start ▶** unlocks sound on iOS (Apple only allows sound after a tap), then the child taps their character.
- **Topics:** Animals, Science, Maths, German, Italian, Switzerland, Italy, America, My body, Space, Nature and a
  Surprise mix. A round has 6 questions for Little and 10 for Big.
- Every question is read aloud (🔊 repeats it). **Tap an answer once to hear it, tap it again (or ✓) to choose it.**
- Right answer: a sound, confetti, praise and a fun fact. Wrong answer: a gentle sound, the right answer with an
  explanation, and a fun fact. Missed questions come back in later rounds until answered right twice.
- **Rewards:** a star per right answer, 48 stickers in a sticker book (one every 7 stars for Little, 12 for Big),
  explorer badges at 10/25/50/100 right answers per topic, and a plant that grows on every day of playing
  (it never wilts).

## Question bank

About 1,000 questions in German, English and Italian, in `content/<category>.json` (one file per topic), plus
endless generated maths questions. Every question has a picture or emoji per answer, a short explanation and a fun fact.

- Each question is for `little`, `big` or `both` levels. Little sees two answers, Big three or four.
- Language topics (Deutsch, Italiano) use `forLangs` and `answerLang`: children learning the language get
  picture-to-word questions spoken in that language; native speakers get letters, rhymes, syllables and grammar.
- `npm run check-content` validates everything (also run on every build and deploy) and writes
  [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md): coverage per level and language, style notes, and every question
  marked `"uncertain"` for a grown-up to double-check.
- To fix or add a question, edit the JSON and run `npm run check-content`. Keep the `id` of existing questions,
  because children's progress (stars, missed questions) is stored by id.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 and press ▶ first.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run dev:lan` | Same, but reachable from an iPad or iPhone on the same Wi‑Fi (use the `Network:` address it prints) |
| `npm run build` | Checks the content, type-checks, and builds the offline app into `dist/` |
| `npm run preview` | Serves the built `dist/` folder (port 4173) |
| `npm run check-content` | Validates the question bank and writes `CONTENT_REVIEW.md` |
| `npm run icons` | Regenerates the app icons from `public/logo.svg` |

`npm run dev:lan` is handy for trying changes on a real device, but iOS only enables offline mode and
Add to Home Screen on `https://` sites, so test those on the deployed app.

## Deploying

**GitHub Pages (current setup).** Every push to `main` runs `.github/workflows/deploy.yml`: it installs, runs the
content check, builds and publishes `dist/` to https://epdupont-oss.github.io/wunderfrage/. A broken question file
stops the deploy. Progress is not affected by deploys – it lives on the devices.

**Updates on the devices.** The app checks for a new version when it starts, every hour and whenever it comes back
to the foreground. A new version is downloaded quietly and switched to only on the start screen or the
“Who is playing?” screen – never in the middle of a round.

**Cloudflare Pages (alternative).** The build is a plain static folder with relative paths, so it also works at a
domain root:

```bash
npm run build
npx wrangler pages deploy dist --project-name wunderfrage
```

## Testing checklist

- [ ] Offline: open the installed app once with internet, then switch on flight mode, close the app fully and play a
      round in a topic you haven't played yet.
- [ ] Persistence: close the app fully (swipe it away), reopen – stars, stickers and the plant are still there.
- [ ] Language: change a child's language in the parent area – all text *and* speech switch.
- [ ] Backup: save a backup on the iPad, AirDrop it to the iPhone, load it there.
- [ ] Non-reader: a 5-year-old can pick her character, a topic and finish a round by listening and tapping.

## Privacy

No backend, no accounts, no analytics, no ads, no external links, and no requests to other websites. Profiles and
progress are stored only in the browser storage (IndexedDB) of each device, and only leave it when you save a backup.

## Project layout

```
content/<category>.json     question bank, one file per topic (validated by scripts/check-content.ts)
src/i18n/{de,en,it}.json    all UI text and spoken lines
src/speech/speech.ts        speech service: speak(text, lang), queue, cancel, iOS unlock, voice choice
src/audio/sfx.ts            sound effects generated with the Web Audio API
src/storage/db.ts           profiles, progress and settings in IndexedDB
src/storage/backup.ts       backup files: export, validate and merge
src/game/round.ts           round building and simple spaced repetition
src/game/generate.ts        generated maths questions, rebuildable from their id
src/rewards/                stickers, badges, plant stages
src/pwa.ts                  service worker registration and calm-moment updates
src/screens/                start, profiles, home, quiz, round end, collection, parent gate, parent area
src/components/             Pip the owl, avatars, stickers, medals, plant, pictures, confetti
```

The speech service is the only place that talks to `speechSynthesis`. To switch to recorded audio files later,
replace its internals and keep the same `speak` / `cancel` functions.
