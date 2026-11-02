import { projectStarId } from '@/game/content/stars';
import type { GameApi } from '@/game/scene/types';

/**
 * The common exhibit interaction: earn the project's star the first time it is
 * tried, then show the real project details. The star is awarded on every try
 * attempt, but `award` only reports the first one.
 */
export async function tryExhibit(api: GameApi, projectId: string): Promise<void> {
  api.store.award(projectStarId(projectId));
  await api.showProject(projectId);
}
