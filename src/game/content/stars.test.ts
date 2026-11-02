import { describe, expect, it } from 'vitest';
import { personalInfo } from '@/data/personal';
import { projects } from '@/data/projects';
import {
  SILLY_STARS,
  allStarIds,
  projectStarId,
  readStarId,
  starTotal,
} from './stars';

describe('stars', () => {
  it('total_equals_projects_plus_reading_plus_silly', () => {
    expect(starTotal()).toBe(
      projects.length + personalInfo.readingList.length + SILLY_STARS.length,
    );
  });

  it('ids_are_unique', () => {
    const ids = allStarIds();

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ids_follow_the_content_prefixes', () => {
    const ids = new Set(allStarIds());

    for (const project of projects) {
      expect(ids.has(`project:${project.id}`)).toBe(true);
    }

    // Literal ids, not readStarId(), so a slug regression fails loudly.
    expect(ids.has('read:one-piece')).toBe(true);
    expect(
      ids.has(
        'read:structure-and-interpretation-of-computer-programs-sicp',
      ),
    ).toBe(true);
    expect(ids.has('read:computer-networking-a-top-down-approach')).toBe(true);

    for (const id of ['silly:pet-cat', 'silly:cold-tea', 'silly:read-note']) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('id_helpers_build_documented_ids', () => {
    expect(projectStarId('routing-sim')).toBe('project:routing-sim');
    expect(readStarId('One Piece')).toBe('read:one-piece');
    expect(readStarId("Huzbi's Manga, Vol. 2")).toBe('read:huzbis-manga-vol-2');
  });
});
