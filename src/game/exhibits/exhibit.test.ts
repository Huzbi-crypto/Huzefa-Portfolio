import { describe, expect, it, vi } from 'vitest';
import { createStore } from '@/game/state/store';
import type { GameApi } from '@/game/scene/types';
import { tryExhibit } from './exhibit';

function fakeApi(): GameApi {
  const store = createStore(null);
  return {
    store,
    goTo: vi.fn(),
    openTerminal: vi.fn(),
    showProject: vi.fn(async () => undefined),
  };
}

describe('tryExhibit', () => {
  it('tryExhibit_awards_once', async () => {
    const api = fakeApi();
    const projectId = 'routing-sim';

    await tryExhibit(api, projectId);
    expect(api.store.getState().found).toContain(`project:${projectId}`);
    expect(api.showProject).toHaveBeenCalledWith(projectId);

    const stars = api.store.getState().found.filter((id) => id === `project:${projectId}`);
    await tryExhibit(api, projectId);

    expect(stars).toHaveLength(1);
    expect(api.store.getState().found.filter((id) => id === `project:${projectId}`)).toHaveLength(1);
    expect(api.showProject).toHaveBeenCalledTimes(2);
  });
});
