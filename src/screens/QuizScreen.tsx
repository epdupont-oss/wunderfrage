import { useEffect, useRef, useState } from 'preact/hooks';
import { Confetti } from '../components/Confetti';
import { Mascot } from '../components/Mascot';
import { graphemes, isText, Pictures } from '../components/Pictures';
import type { Answer, Question } from '../content/schema';
import type { CategoryId } from '../content/categories';
import type { RoundQuestion } from '../game/round';
import { pick, t, type Lang } from '../i18n';
import { cancel, speak, speakNow } from '../speech/speech';
import { sfxCorrect, sfxGentle, sfxTap } from '../audio/sfx';
import type { Profile } from '../storage/db';

type Phase = 'ask' | 'reveal';

/** A piece of spoken text in one language; feedback can mix languages ("Die Antwort ist: mela"). */
interface Segment {
  text: string;
  lang: Lang;
}

/** Speak segments in order. Resolves true if all of them were spoken to the end. */
async function speakSegments(segments: Segment[]): Promise<boolean> {
  // Leading punctuation left over from splitting a sentence around the answer is not spoken.
  const spoken = segments
    .map((s) => ({ ...s, text: s.text.trim().replace(/^[.!?:]+\s*/, '') }))
    .filter((s) => /[\p{L}\p{N}]/u.test(s.text));
  if (!spoken.length) return true;
  const [first, ...rest] = spoken;
  const all = [speakNow(first.text, first.lang), ...rest.map((s) => speak(s.text, s.lang))];
  return (await Promise.all(all)).every(Boolean);
}

export function QuizScreen({
  profile,
  category,
  round,
  onAnswer,
  onHintSeen,
  onFinish,
  onQuit,
}: {
  profile: Profile;
  category: CategoryId | 'surprise';
  round: RoundQuestion[];
  onAnswer: (q: Question, correct: boolean) => void;
  onHintSeen: () => void;
  onFinish: (stars: number) => void;
  onQuit: () => void;
}) {
  const lang = profile.lang;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('ask');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [feedback, setFeedback] = useState<Segment[]>([]);
  const [showHint, setShowHint] = useState(!profile.hintSeen);
  const [factRead, setFactRead] = useState(false);
  const stars = useRef(0);

  const { question: q, options } = round[idx];
  const isLast = idx === round.length - 1;
  const correctAnswer = q.answers.find((a) => a.correct)!;
  // Language categories show and speak the answers in the language being learned.
  const answerLang: Lang = q.answerLang ?? lang;
  const answerText = (a: Answer) => a.label[answerLang];
  const isWord = q.type === 'word';
  // If any card shows several pictures (e.g. 🧁🧁🧁 vs 🧁), draw all cards at the same item size.
  const gridIcons = options.some((o) => !isText(o.icon) && graphemes(o.icon).length > 1);
  // Written-word answers (grammar questions) need wider cards.
  const longText = options.some((o) => isText(o.icon) && o.icon.length > 5);

  // Read the question aloud whenever it appears.
  useEffect(() => {
    if (idx === 0) void speak(t(lang, 'home.letsGo', { category: t(lang, `categories.${category}`) }), lang);
    void speak(q.prompt[lang], lang);
    if (showHint) void speak(t(lang, 'quiz.hint'), lang);
  }, [idx]);

  const funFactSegment = (): Segment => ({ text: `${t(lang, 'feedback.funFact')} ${q.funFact[lang]}`, lang });

  const readFeedback = (segments: Segment[]) => {
    setFactRead(false);
    void speakSegments([...segments, funFactSegment()]).then((done) => done && setFactRead(true));
  };

  const replay = () => {
    if (phase === 'ask') void speakNow(q.prompt[lang], lang);
    else readFeedback(feedback);
  };

  const tapAnswer = (a: Answer) => {
    if (phase !== 'ask') return;
    if (selected === a.id) return confirm(a);
    setSelected(a.id);
    sfxTap();
    void speakNow(answerText(a), answerLang);
  };

  function buildFeedback(correct: boolean): Segment[] {
    if (correct) return [{ text: pick(lang, 'feedback.praise'), lang }];
    const tryAgain = pick(lang, 'feedback.tryAgain');
    if (q.type === 'truefalse') {
      const reveal = t(lang, correctAnswer.icon === '👍' ? 'feedback.isTrue' : 'feedback.isFalse');
      return [{ text: `${tryAgain} ${reveal} ${q.explanation[lang]}`, lang }];
    }
    if (answerLang !== lang) {
      // Language questions: end the sentence on the foreign word, so iOS switches voices at a
      // natural pause ("Good try! In Italian, you say: … gatto"), then go straight on to the fun fact.
      return [
        { text: `${tryAgain} ${t(lang, 'feedback.wordIs', { language: t(lang, `languageName.${answerLang}`) })}`, lang },
        { text: answerText(correctAnswer), lang: answerLang },
      ];
    }
    // "The answer is: {answer}." followed by the explanation.
    const [before, after = ''] = t(lang, 'feedback.answerIs', { answer: '\u0000' }).split('\u0000');
    return [
      { text: `${tryAgain} ${before}`, lang },
      { text: answerText(correctAnswer), lang: answerLang },
      { text: `${after} ${q.explanation[lang]}`, lang },
    ];
  }

  const confirm = (a: Answer) => {
    if (showHint) {
      setShowHint(false);
      onHintSeen();
    }
    const correct = a.correct;
    setPhase('reveal');
    setWasCorrect(correct);
    onAnswer(q, correct);
    if (correct) {
      stars.current += 1;
      sfxCorrect();
    } else {
      sfxGentle();
    }
    const segments = buildFeedback(correct);
    setFeedback(segments);
    readFeedback(segments);
  };

  const next = () => {
    cancel();
    if (isLast) return onFinish(stars.current);
    setIdx(idx + 1);
    setSelected(null);
    setPhase('ask');
    setFactRead(false);
  };

  const cardState = (a: Answer) => {
    if (phase === 'ask') return a.id === selected ? 'selected' : '';
    if (a.correct) return 'correct';
    return a.id === selected ? 'chosen-wrong' : 'dim';
  };

  const feedbackText = feedback
    .map((s) => s.text.trim())
    .join(' ')
    .replace(/\s+([.!?:])/g, '$1');

  return (
    <main class={`screen quiz-screen phase-${phase}`}>
      <header class="topbar">
        <button type="button" class="icon-btn" onClick={onQuit} aria-label={t(lang, 'quiz.stop')}>
          🏠
        </button>
        <div class="dots" aria-hidden="true">
          {round.map((_, i) => (
            <span key={i} class={i < idx ? 'done' : i === idx ? 'now' : ''} />
          ))}
        </div>
        <button type="button" class="icon-btn speaker" onClick={replay} aria-label={t(lang, 'quiz.replay')}>
          🔊
        </button>
      </header>

      <section class="question">
        <Mascot size={110} mood={phase === 'reveal' ? (wasCorrect ? 'happy' : 'thinking') : 'idle'} />
        <button type="button" class="bubble question-bubble" onClick={replay}>
          <span>{q.prompt[lang]}</span>
        </button>
      </section>

      {q.visual && (
        <button type="button" class={`question-visual type-${q.type}`} onClick={replay} aria-hidden="true" tabIndex={-1}>
          <Pictures value={q.visual} />
        </button>
      )}

      <section class={`answers n${options.length} type-${q.type}${longText ? ' long-text' : ''}`}>
        {options.map((a, i) => (
          <button
            type="button"
            key={a.id}
            class={`answer ${cardState(a)}`}
            onClick={() => tapAnswer(a)}
            aria-pressed={a.id === selected}
            lang={answerLang}
          >
            {isWord ? (
              <>
                {phase === 'reveal' && <span class="answer-icon small">{a.icon}</span>}
                <span class="answer-word">{answerText(a)}</span>
                {phase === 'ask' && (
                  <span class="answer-speaker" aria-hidden="true">
                    🔊
                  </span>
                )}
              </>
            ) : (
              <>
                <Pictures value={a.icon} class="answer-icon" grid={gridIcons} />
                {/* No label under picture groups: "4" would give away the counting. It is still spoken on tap. */}
                {!gridIcons && answerText(a) !== a.icon && <span class="answer-label">{answerText(a)}</span>}
              </>
            )}
            {phase === 'reveal' && a.correct && <span class="badge-ok">✓</span>}
            {showHint && i === 0 && phase === 'ask' && (
              <span class="hint-hand" aria-hidden="true">
                👆
              </span>
            )}
          </button>
        ))}
      </section>

      {phase === 'ask' && selected && (
        <button
          type="button"
          class="confirm-btn"
          onClick={() => confirm(options.find((o) => o.id === selected)!)}
          aria-label={t(lang, 'quiz.confirm')}
        >
          ✓
        </button>
      )}

      {phase === 'reveal' && (
        <section class={`feedback ${wasCorrect ? 'good' : 'gentle'}`}>
          {wasCorrect && <Confetti />}
          <p class="feedback-line">
            <span aria-hidden="true">{wasCorrect ? '🎉 ' : '💡 '}</span>
            {feedbackText}
          </p>
          <p class="fun-fact">
            <b>{t(lang, 'feedback.funFact')}</b> {q.funFact[lang]}
          </p>
          <button type="button" class={`next-btn${factRead ? ' pulse' : ''}`} onClick={next} aria-label={t(lang, 'quiz.next')}>
            ▶
          </button>
        </section>
      )}
    </main>
  );
}
