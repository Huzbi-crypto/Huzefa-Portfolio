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

  /** The first dark space. Notes are written as Huzbi's, for Huzbi to edit. */
  dark: {
    arrival: {
      mouse: [
        'It is very dark in here.',
        'Your cursor is the lantern. Wave it about.',
      ],
      keyboard: [
        'It is very dark in here.',
        'The lantern stays with you. Walk, and look.',
      ],
      touch: [
        'It is very dark in here.',
        'Drag a finger to move the light. Tap to walk.',
      ],
    },

    /** Painted on the walls with the tiny chalk font, capitals only. */
    chalk: ['READ THESE', 'KEEP LOOKING'],

    exit: {
      label: 'Back to the room',
      lines: [
        'The door you came through, still open and spilling warm light.',
        'Cold mug, cat, 2 AM. The good place.',
      ],
      backLabel: 'GO BACK',
      stayLabel: 'NOT YET',
      stayReply: ['Brave. Keep the lantern up.'],
    },

    monitor: {
      label: 'Look at the monitor',
      lines: [
        'A monitor, on by itself, in a place with no sockets.',
        'The screen is one big eye. It follows your light. Then it looks at you. Then your light again.',
        'It blinks, slowly. You decide to call that friendly.',
      ],
      again: ['The eye finds you again. Still friendly. Probably.'],
    },

    noteOne: {
      label: 'Read the page',
      lines: [
        'A page pinned to the wall, written in a hurry:',
        '"If you can read this, the door worked. Sorry about the dark."',
        '"The bulb went and I put off fixing it. Typical."',
      ],
      again: ['"Sorry about the dark." You are, by now, mostly used to it.'],
    },

    noteTwo: {
      label: 'Read the page',
      lines: [
        'Another page, more crumpled than the first:',
        '"I left a few things lying around in here. Mind the cat. I did not put the cat here."',
        '"The monitor is not mine. It keeps looking at me."',
      ],
      again: ['"I did not put the cat here." Noted, twice now.'],
    },

    arch: {
      label: 'Peer down the passage',
      lines: [
        'A passage. After the first few steps it is just black.',
        'Even the lantern gives up. A draft smells faintly of toast.',
        'Not today. Maybe after a snack.',
      ],
    },

    cat: {
      label: 'Say hello',
      lines: [
        'Two amber eyes. Then a tail flick.',
        'It is the cat. You are fairly sure you left it in the room.',
        'It blinks slowly. It knew about this place already.',
      ],
      again: ['The cat is busy pretending it was always here.'],
    },

    routing: {
      label: 'Inspect the board',
      /** Said first, before the facts that come from `src/data/projects.ts`. */
      flavour: 'A board of tiny routers. One link is broken, so a green packet takes the long way round.',
      again: 'The packet is still taking the long way round. Respect.',
      sourceLead: 'Source:',
    },
  },
} as const;
