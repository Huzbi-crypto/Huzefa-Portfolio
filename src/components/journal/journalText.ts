/**
 * The words around the journal pages: the banner, the not-found and error
 * pages. Page content itself comes from `src/data`. Huzbi edits these.
 */
export const journalText = {
  siteName: "Huzbi's room",
  banner: {
    lead: 'Huzbi stepped out and left the door open.',
    link: 'Play the room.',
    note: 'A small game, if you want it.',
  },
  nav: {
    label: 'Main',
    play: 'Play',
    projects: 'Projects',
    github: 'GitHub',
    about: 'About',
    contact: 'Contact',
  },
  tools: {
    terminal: 'CLI',
    terminalLabel: 'Toggle the retro terminal',
    theme: 'Theme',
    crt: 'CRT',
    crtOn: 'on',
    crtOff: 'off',
  },
  notFound: {
    title: 'Nothing here yet.',
    lede: 'Wrong door. The note on the desk still says back in five minutes, so nobody is around to ask.',
    toHome: 'Back to the front page',
    toPlay: 'Play the room',
    toProjects: 'See the projects',
    art: 'An open door with a dark room behind it',
  },
  error: {
    title: 'Something tripped over a cable.',
    lede: 'The page broke while loading. Try again, or go back to the front page.',
    retry: 'Try again',
    toHome: 'Back to the front page',
    toPlay: 'Play the room',
    digest: 'Error code',
    art: 'A lamp, left on',
  },
} as const;
