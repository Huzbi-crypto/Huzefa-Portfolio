// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { copy } from '@/game/content/copy';
import { SoundToggle } from './SoundToggle';

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

async function mount(enabled: boolean, onToggle: () => void): Promise<void> {
  await act(async () => {
    root.render(createElement(SoundToggle, { enabled, onToggle }));
  });
}

function button(): HTMLButtonElement {
  const found = container.querySelector('button');
  if (!found) throw new Error('no sound button');
  return found;
}

describe('SoundToggle', () => {
  it('shows_a_real_label_and_pressed_state', async () => {
    await mount(false, () => undefined);

    expect(button().getAttribute('aria-pressed')).toBe('false');
    expect(button().getAttribute('aria-label')).toBe(copy.ui.soundOffLabel);
    expect(container.textContent).toContain(copy.ui.soundOff);
  });

  it('says_when_sound_is_on', async () => {
    await mount(true, () => undefined);

    expect(button().getAttribute('aria-pressed')).toBe('true');
    expect(button().getAttribute('aria-label')).toBe(copy.ui.soundOnLabel);
    expect(container.textContent).toContain(copy.ui.soundOn);
  });

  it('a_click_toggles_the_sound', async () => {
    const onToggle = vi.fn();
    await mount(false, onToggle);

    act(() => {
      button().click();
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('uses_a_real_button_so_keyboard_and_touch_work', async () => {
    await mount(false, () => undefined);

    expect(button().tagName).toBe('BUTTON');
    expect(button().getAttribute('type')).toBe('button');
    expect(button().getAttribute('aria-hidden')).toBeNull();
    expect(button().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
