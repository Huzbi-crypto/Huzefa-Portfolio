// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JournalPage } from './JournalPage';
import { AppProvider } from '@/context/AppContext';

type JournalPageProps = Parameters<typeof JournalPage>[0];

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

async function mount(props: JournalPageProps): Promise<void> {
  await act(async () => {
    root.render(createElement(AppProvider, null, createElement(JournalPage, props)));
  });
}

describe('JournalPage', () => {
  it('shows_the_quiet_banner_by_default', async () => {
    await mount({ title: 'A page', children: 'Body' });
    expect(container.querySelector('.mystery-banner')).not.toBeNull();
  });

  it('can_hide_the_banner_for_the_front_page', async () => {
    await mount({ title: 'A page', children: 'Body', showBanner: false });
    expect(container.querySelector('.mystery-banner')).toBeNull();
  });
});
