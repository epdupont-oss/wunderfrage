# Wunderfrage

A talking quiz game for curious kids (about 5 and 8 years old), in German, English and Italian.
Everything is read aloud and every answer has a picture, so children who can't read yet can play alone.
No ads, no accounts, no tracking. After the first load it works fully offline.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:5173. Press ▶ first: browsers only allow speech after a tap.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run dev:lan` | Same, but reachable from other devices on your Wi‑Fi |
| `npm run build` | Checks the content, type-checks, and builds the offline app into `dist/` |
| `npm run preview` | Serves the built `dist/` folder (port 4173) |
| `npm run check-content` | Validates the question bank and writes `CONTENT_REVIEW.md` |
| `npm run icons` | Regenerates the app icons from `public/logo.svg` |

## Testing on the iPad or iPhone

### Quick test over Wi‑Fi (gameplay and speech)

1. Connect the Mac and the iPad to the same Wi‑Fi.
2. On the Mac, run `npm run dev:lan`. Vite prints a `Network:` address such as `http://192.168.1.23:5173`.
3. Open that address in **Safari** on the iPad.
4. Tap ▶, create the profiles, and play a round.

This tests speech, tapping and layout. It **does not** test offline use or "Add to Home Screen", because iOS only
allows the offline service worker on `https://` sites (or `localhost`). For those, use the deployed version below.

### Full test (offline and Home Screen)

1. Deploy the app (see below) so it has an `https://` address.
2. Open it in Safari on the iPad, tap ▶ and play once (this downloads everything).
3. Tap **Share → Add to Home Screen**.
4. Turn on flight mode, open Wunderfrage from the Home Screen, and play a round.
5. Close the app fully (swipe it away), open it again: the stars and profiles are still there.

### Nicer voices

iOS ships with basic voices. For much nicer speech, on each device go to
**Settings → Accessibility → Spoken Content → Voices** and download an *Enhanced* or *Premium* voice for
German, English and Italian. Then fully close and reopen the app. Wunderfrage picks the best installed voice
automatically; you can override it in the parent area.

## Parent area

Hold the ⚙️ button for 3 seconds, then answer the maths question. There you can add, edit or delete profiles,
and set each child's level, language, speaking speed, sound effects and topics. You can also reset progress
and choose voices.

## Deploying (free static hosting)

The build is a plain static folder (`dist/`) with relative paths, so it works at a domain root or in a subfolder.

**Cloudflare Pages**

```bash
npm run build
npx wrangler pages deploy dist --project-name wunderfrage
```

Or connect the Git repository in the Cloudflare dashboard with build command `npm run build` and output directory `dist`.

**GitHub Pages**

Push the repository to GitHub, then build and publish `dist/` (for example with the official
`actions/upload-pages-artifact` + `actions/deploy-pages` workflow, build command `npm run build`).
The app will live at `https://<user>.github.io/<repo>/`.

## Question bank

About 1,000 questions in German, English and Italian, in `content/<category>.json` (one file per topic), plus
endless generated maths questions. Every question has a picture or emoji per answer, a short explanation and a fun fact.

- Each question is for `little`, `big` or `both` levels. Little sees two answers, Big three or four.
- Language topics (Deutsch, Italiano) use `forLangs` and `answerLang`: children learning the language get
  picture-to-word questions spoken in that language; native speakers get letters, rhymes, syllables and grammar.
- `npm run check-content` validates everything (also run by `npm run build`) and writes
  [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md): coverage per level and language, style notes, and every question
  marked `"uncertain"` for a grown-up to double-check.
- To fix or add a question, edit the JSON and run `npm run check-content`. Keep the `id` of existing questions,
  because children's progress (stars, missed questions) is stored by id.

## Project layout

```
content/<category>.json   question bank, one file per category (validated by scripts/check-content.ts)
src/i18n/{de,en,it}.json  all UI text and spoken lines
src/speech/speech.ts      speech service: speak(text, lang), queue, cancel, iOS unlock, voice choice
src/audio/sfx.ts          sound effects generated with the Web Audio API
src/storage/db.ts         profiles, progress and settings in IndexedDB
src/game/round.ts         round building and simple spaced repetition
src/game/generate.ts      generated maths questions (counting, dots, + − ×), rebuildable from their id
src/screens/              start, profiles, home, quiz, round end, parent gate, parent area
src/components/           Pip the owl, avatars, confetti, hold-to-open button
```

The speech service is the only place that talks to `speechSynthesis`. To switch to recorded audio files later,
replace its internals and keep the same `speak` / `cancel` functions.
