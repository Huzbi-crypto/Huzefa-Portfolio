'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { contactCardOpen, subscribeContactCard } from '@/game/scene/nap';
import type { GameStore } from '@/game/state/store';
import { choiceInDirection, type ChoiceBox, type ChoiceDirection } from './choiceNavigation';
import { useFocusTrap } from './useFocusTrap';

const CHOICE_DIRECTIONS: Record<string, ChoiceDirection> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
};

/**
 * The dialogue panel. Text types in character by character for sighted
 * visitors while a hidden live region carries the full line for screen
 * readers. Enter, Space or a tap moves on; Esc leaves (and takes the last,
 * safest choice).
 */
export function DialogueBox({ store }: { store: GameStore }) {
  const ui = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const dialogue = ui.dialogue;
  const [selected, setSelected] = useState(0);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  // The ending contact card can sit over the reply dialogue. Only one modal
  // may own focus, or the two traps would bounce focus between them forever.
  const contactOpen = useSyncExternalStore(subscribeContactCard, contactCardOpen, () => false);
  useFocusTrap(Boolean(dialogue) && !contactOpen, panelRef);

  const line = dialogue ? (dialogue.lines[dialogue.line] ?? '') : '';
  const complete = dialogue ? dialogue.typed >= line.length : false;
  const onLastLine = dialogue ? dialogue.line >= dialogue.lines.length - 1 : false;
  const showChoices = Boolean(dialogue && complete && onLastLine && dialogue.choices.length > 0);

  // A new dialogue starts on its first choice.
  const lines = dialogue?.lines;
  useEffect(() => {
    setSelected(0);
  }, [lines]);

  useEffect(() => {
    if (showChoices) choiceRefs.current[selected]?.focus({ preventScroll: true });
  }, [showChoices, selected]);

  const advance = useCallback(
    (choiceId?: string) => {
      store.advance(choiceId);
    },
    [store],
  );

  useEffect(() => {
    if (!dialogue) return;
    const choices = dialogue.choices;

    const onKey = (event: KeyboardEvent): void => {
      const key = event.key;
      const onChoiceButton =
        event.target instanceof HTMLElement && event.target.closest('.dialogue-choice') !== null;

      if (key === 'Escape') {
        event.preventDefault();
        const safest = choices[choices.length - 1]?.id;
        for (let guard = 0; guard < 64 && store.getState().dialogue; guard += 1) {
          store.advance(safest);
        }
        return;
      }

      if (showChoices && choices.length > 1) {
        const direction = CHOICE_DIRECTIONS[key.toLowerCase()];
        if (direction) {
          event.preventDefault();
          const active = choiceRefs.current.findIndex((button) => button === document.activeElement);
          const current = active >= 0 ? active : selected;
          const boxes = choiceRefs.current.map((button) =>
            button ? button.getBoundingClientRect() : null,
          );
          const laidOut =
            boxes.length === choices.length &&
            boxes.every((box) => box !== null && (box.width > 0 || box.height > 0));

          if (laidOut) {
            setSelected(choiceInDirection(current, boxes as ChoiceBox[], direction));
          } else {
            // No layout (jsdom, hidden panel): keep the old linear fallback.
            const forward = direction === 'down' || direction === 'right';
            setSelected((index) => (index + (forward ? 1 : -1) + choices.length) % choices.length);
          }
          return;
        }
      }

      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        // A focused choice button handles its own press through click.
        if (onChoiceButton) {
          if (!event.repeat) (event.target as HTMLElement).click();
          return;
        }
        if (!event.repeat) advance(choices[selected]?.id);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogue, showChoices, selected, advance, store]);

  if (!dialogue) return null;

  const shown = line.slice(0, Math.floor(dialogue.typed));

  return (
    <div
      ref={panelRef}
      className="dialogue px-panel"
      role="dialog"
      aria-label="Dialogue"
      tabIndex={-1}
      onClick={() => {
        if (!showChoices) advance(dialogue.choices[selected]?.id);
      }}
    >
      <p className="sr-live" aria-live="polite">
        {line}
      </p>
      <p className="dialogue-text" aria-hidden="true">
        {shown}
      </p>
      {showChoices ? (
        <ul className="dialogue-choices">
          {dialogue.choices.map((choice, index) => (
            <li key={choice.id}>
              <button
                type="button"
                className="dialogue-choice"
                ref={(node) => {
                  choiceRefs.current[index] = node;
                }}
                aria-current={index === selected}
                onClick={(event) => {
                  event.stopPropagation();
                  advance(choice.id);
                }}
                onFocus={() => setSelected(index)}
              >
                {choice.label}
              </button>
            </li>
          ))}
        </ul>
      ) : complete ? (
        <span className="dialogue-more" aria-hidden="true" />
      ) : null}
    </div>
  );
}
