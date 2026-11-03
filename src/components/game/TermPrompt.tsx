'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { copy } from '@/game/content/copy';
import { MAX_INPUT } from '@/game/exhibits/logic/miniShell';
import {
  closeTermPrompt,
  subscribeTermPrompt,
  submitTermPrompt,
  termPromptState,
} from '@/game/exhibits/termExp';
import './game.css';

/**
 * The little terminal's real keyboard: a DOM prompt with an input, the shell's
 * history, and the same tap-able commands as buttons. The exhibit owns the
 * shell state, so every command goes through `runCommand` on the way here.
 */
export function TermPrompt() {
  const prompt = useSyncExternalStore(
    subscribeTermPrompt,
    termPromptState,
    () => null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState('');

  // A new session starts with an empty field and the cursor in it.
  useEffect(() => {
    if (!prompt) return;

    setLine('');
    inputRef.current?.focus({ preventScroll: true });

    const keepIn = (event: FocusEvent): void => {
      const panel = panelRef.current;
      if (panel && event.target instanceof Node && !panel.contains(event.target)) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('focusin', keepIn);

    return () => {
      document.removeEventListener('focusin', keepIn);
    };
  }, [prompt?.id]);

  // Esc closes it, whether the field or a command button has focus.
  useEffect(() => {
    if (!prompt) return;

    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      closeTermPrompt();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [prompt?.id]);

  if (!prompt) return null;

  const send = (): void => {
    const text = line;
    setLine('');
    submitTermPrompt(text);
    inputRef.current?.focus({ preventScroll: true });
  };

  const pick = (choiceLine: string | undefined): void => {
    if (choiceLine === undefined) {
      closeTermPrompt();
      return;
    }
    setLine('');
    submitTermPrompt(choiceLine);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      className="term-prompt-backdrop"
      data-testid="term-prompt-backdrop"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={panelRef}
        className="term-prompt px-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="term-prompt-title"
        aria-describedby="term-prompt-hint"
      >
        <header className="term-prompt-head">
          <h2 id="term-prompt-title" className="term-prompt-title">
            {prompt.label}
          </h2>
          <span className="term-prompt-kicker" aria-hidden="true">
            {prompt.kicker}
          </span>
          <button
            type="button"
            className="term-prompt-close"
            data-close
            aria-label={prompt.closeLabel}
            onClick={() => closeTermPrompt()}
          >
            {prompt.close}
          </button>
        </header>

        <div className="term-prompt-body">
          <div
            className="term-prompt-screen"
            role="log"
            aria-live="polite"
            aria-label={prompt.outputLabel}
          >
            {prompt.intro.map((text, index) => (
              <p key={`intro-${index}`} className="term-prompt-line">
                {text}
              </p>
            ))}
            {prompt.history.map((entry, index) => (
              <div key={`${entry.command}-${index}`} className="term-prompt-entry">
                <p className="term-prompt-command">{copy.archive.term.promptCommand(entry.command)}</p>
                {entry.output.map((text, lineIndex) => (
                  <p key={`out-${index}-${lineIndex}`} className="term-prompt-output">
                    {text}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="term-prompt-side">
            <form
              className="term-prompt-form"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <label className="term-prompt-label" htmlFor="term-prompt-input">
                {prompt.inputLabel}
              </label>
              <span className="term-prompt-caret" aria-hidden="true">
                &gt;
              </span>
              <input
                ref={inputRef}
                id="term-prompt-input"
                className="term-prompt-input"
                type="text"
                value={line}
                maxLength={MAX_INPUT}
                aria-label={prompt.inputLabel}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={copy.archive.term.promptEmpty}
                onChange={(event) => setLine(event.target.value)}
              />
            </form>

            <p id="term-prompt-hint" className="term-prompt-hint">
              {prompt.hint}
            </p>

            <ul className="term-prompt-choices" aria-label={prompt.choicesLabel}>
              {prompt.choices.map((choice) => (
                <li key={choice.id}>
                  <button
                    type="button"
                    className="term-prompt-choice"
                    onClick={() => pick(choice.line)}
                  >
                    {choice.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
