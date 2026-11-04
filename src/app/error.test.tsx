// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AppProvider } from '@/context/AppContext';
import { journalText } from '@/components/journal/journalText';
import GlobalError from './error';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe('the error journal page', () => {
  it('shows the pixel page, retries, and offers the room', async () => {
    const reset = vi.fn();
    const error = Object.assign(new Error('boom'), { digest: 'digest-42' });

    await act(async () => {
      root.render(createElement(AppProvider, null, createElement(GlobalError, { error, reset })));
    });

    expect(container.querySelector('.journal-root')).not.toBeNull();
    expect(container.querySelector('h1')?.textContent).toContain(journalText.error.title);
    expect(container.textContent).toContain('digest-42');
    expect(container.querySelector('a[href="/"]')).not.toBeNull();

    const retry = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === journalText.error.retry,
    );
    expect(retry).toBeDefined();
    await act(async () => retry?.click());
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
