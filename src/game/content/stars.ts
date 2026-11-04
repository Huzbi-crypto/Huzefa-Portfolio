import { personalInfo } from '@/data/personal';
import { projects } from '@/data/projects';

/**
 * Silly discoveries that are not tied to a project or a shelf item. Ids are
 * stable because saved progress stores them.
 */
export const SILLY_STARS: string[] = [
  'silly:pet-cat',
  'silly:cold-tea',
  'silly:read-note',
  'silly:monster-poster',
  'silly:sofa',
  'silly:lamp',
  'silly:rug',
  'silly:note-thrice',
  'silly:drink-tea',
  'silly:wave-at-sky',
  'silly:door-chicken',
  'silly:terminal-secret',
];

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function projectStarId(projectId: string): string {
  return `project:${projectId}`;
}

export function readStarId(title: string): string {
  return `read:${slugify(title)}`;
}

/**
 * Every star in the game, derived from content so adding a project or a
 * shelf item adds a star without touching saved-progress code.
 */
export function allStarIds(): string[] {
  return [
    ...projects.map((project) => projectStarId(project.id)),
    ...personalInfo.readingList.map((item) => readStarId(item.title)),
    ...SILLY_STARS,
  ];
}

export function starTotal(): number {
  return projects.length + personalInfo.readingList.length + SILLY_STARS.length;
}
