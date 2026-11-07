// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createStore, type GameStore } from '@/game/state/store';
import { DialogueBox } from './DialogueBox';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

async function mount(store: GameStore): Promise<void> {
  await act(async () => {
    root.render(createElement(DialogueBox, { store }));
  });
}

function openChoices(store: GameStore): void {
  act(() => {
    void store.say(['Pick one.'], [
      { id: 'left', label: 'SPIN LEFT' },
      { id: 'right', label: 'SPIN RIGHT' },
      { id: 'up', label: 'TILT UP' },
      { id: 'down', label: 'TILT DOWN' },
      { id: 'leave', label: 'LET GO' },
    ]);
  });
}

/** jsdom has no layout, so give the five buttons the boxes the flex row would. */
function layOutChoices(): HTMLButtonElement[] {
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('.dialogue-choice'));
  const boxes = [
    { left: 0, top: 0, width: 120, height: 44 },
    { left: 132, top: 0, width: 120, height: 44 },
    { left: 264, top: 0, width: 120, height: 44 },
    { left: 396, top: 0, width: 120, height: 44 },
    { left: 0, top: 56, width: 120, height: 44 },
  ];
  buttons.forEach((button, index) => {
    const box = boxes[index]!;
    button.getBoundingClientRect = () =>
      ({
        ...box,
        right: box.left + box.width,
        bottom: box.top + box.height,
        x: box.left,
        y: box.top,
        toJSON: () => box,
      }) as DOMRect;
  });
  return buttons;
}

describe('DialogueBox choice navigation', () => {
  it('arrow_down_reaches_the_wrapped_exit_choice_in_one_press', async () => {
    const store = createStore(null);
    store.setReducedMotion(true);
    await mount(store);
    openChoices(store);
    const buttons = layOutChoices();
    expect(document.activeElement).toBe(buttons[0]);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[4]);
  });

  it('arrow_up_returns_from_the_exit_to_the_first_choice', async () => {
    const store = createStore(null);
    store.setReducedMotion(true);
    await mount(store);
    openChoices(store);
    const buttons = layOutChoices();
    act(() => buttons[4]!.focus());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });

    expect(document.activeElement).toBe(buttons[0]);
  });
});
