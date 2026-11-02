/**
 * Every joke, note and line of dialogue the visitor reads lives here, so
 * Huzbi can edit the voice in one place. Facts about Huzbi come from
 * `src/data`, never from here.
 */
export const copy = {
  ui: {
    starCounter: 'Stars',
    controlsKeys: 'Arrow keys or WASD to walk',
    controlsMouse: 'or click anywhere',
    controlsTouch: 'Tap to walk',
    controlsInteract: 'Enter to use things',
    useVerbKey: 'Enter',
    useVerbClick: 'Click',
    useVerbTap: 'Tap',
    continue: 'Continue',
    speaker: 'Room',
  },

  note: {
    lines: [
      'A sticky note, scribbled in a hurry:',
      '"Back in 5 mins. Don\'t touch anything."',
      'Bold of you to read it, then.',
    ],
    again: ['"Back in 5 mins. Don\'t touch anything." Still there. So are you.'],
  },

  tea: {
    lines: [
      'A mug of tea. Stone cold. There is a skin on it.',
      'Whenever Huzbi left, it was not five minutes ago.',
    ],
    again: ['You are not drinking that. Nobody is drinking that.'],
  },

  monitor: {
    lines: ['Still on. The cursor blinks like it is waiting for you.'],
  },

  shelf: {
    pull: (title: string) => `You pull out ${title}.`,
    empty: [
      'That is the whole shelf.',
      'Huzbi has opinions about every spine on it.',
    ],
  },

  cat: {
    pets: [
      'Purr.',
      'The cat leans into your hand.',
      'It allows this. Reportedly rare.',
      'A slow blink. That means something, you think.',
      'The cat is now a warm, loud loaf.',
      'It tolerates you. Respect.',
      'You hit the exact spot behind the ear.',
      'Tail flick. Whatever that means, it is positive.',
      'The cat yawns. You can see all of its teeth. You are trusted.',
    ],
    tenth: [
      'Ten pets. The cat has decided you are allowed here.',
      'That is, apparently, worth a star.',
    ],
    afterTenth: ['The cat has seen enough of you. Fair, but it does not leave.'],
  },

  window: {
    none: [
      'The night sky, 2 AM edition. Nothing much up there yet.',
      'Go touch things. The sky fills in as you find them.',
    ],
    some: (found: number, total: number) => [
      `${found} of ${total} stars are up.`,
      'The sky fills in as you find things.',
    ],
    all: ['Every star is out. Okay, you win. Show-off.'],
  },

  door: {
    lines: ['There is a door in the wall.', 'This door was not here yesterday.'],
    again: ['The door is open. It is very dark in there.'],
    openLabel: 'OPEN IT',
    enterLabel: 'GO IN',
    stayLabel: 'STAY',
    stayReply: ['Yeah. Probably fine. Probably.'],
    notReady: ['It opens onto dark, then thinks better of it. Come back soon.'],
  },
} as const;
