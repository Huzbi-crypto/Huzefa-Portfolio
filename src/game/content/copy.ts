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
    soundOn: 'SOUND ON',
    soundOff: 'SOUND OFF',
    soundOnLabel: 'Sound is on. Turn sound off.',
    soundOffLabel: 'Sound is off. Turn sound on.',
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

  /** Shared wording for leaving one dark space for another. */
  spaces: {
    exit: {
      lines: ['The way out. Same dark, different corner.'],
      goLabel: 'GO BACK',
      stayLabel: 'NOT YET',
      stayReply: ['Fair enough. Stay a while.'],
    },
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

  /** The Archive: five project exhibits and the poster. Placeholder voice, for Huzbi to edit. */
  archive: {
    /** Painted on the wall in chalk, capitals only. */
    chalk: ['ARCHIVE', 'SHH', 'BACK'],

    /** The door that stands on its own in the hall. */
    door: {
      label: 'Open the door on its own',
      lines: [
        'A door standing in the middle of the floor, attached to nothing.',
        'A brass plate says ARCHIVE. Through it: boxes, shelves and a smell of old paper.',
      ],
      goLabel: 'GO IN',
      stayLabel: 'NOT YET',
      stayReply: ['Fair. It is not going anywhere. It has no walls to go with.'],
    },

    exit: {
      label: 'Back to the hall',
      lines: [
        'The passage back to the hall. It still smells faintly of toast.',
      ],
      backLabel: 'GO BACK',
      stayLabel: 'NOT YET',
      stayReply: ['Fine. The boxes will keep. They have kept this long.'],
    },

    term: {
      label: 'Use the little terminal',
      intro: [
        'A very small terminal on a stool. The prompt blinks, as if it had been waiting for you specifically.',
        'Try a command. The suggestions below work with a keyboard, a mouse or a thumb.',
      ],
      commands: [
        { id: 'help', line: 'help' },
        { id: 'ls', line: 'ls' },
        { id: 'cat', line: 'cat secrets.txt' },
        { id: 'whoami', line: 'whoami' },
        { id: 'sudo', line: 'sudo make me a sandwich' },
      ],
      leaveLabel: 'STEP AWAY',
      /** The few letters the little screen shows, before and after a command. */
      screenIdle: 'HI?',
      screenReply: {
        help: 'HELP?',
        ls: 'NOPE',
        cat: 'NO.',
        whoami: 'YOU.',
        clear: 'RUDE',
      },
      screenUnknown: 'WHAT?',
    },

    cookies: {
      label: 'Open the cookie jar',
      intro: [
        'A cookie jar with a padlock. The tag on it says "evidence".',
        'Every cookie wears a little label, like a browser session. Somebody has been taking them.',
      ],
      unlockLabel: 'UNLOCK IT',
      leaveLabel: 'LEAVE IT',
      leaveReply: ['Wise. Or suspicious. Hard to tell with cookies.'],
      unlocked: [
        'The padlock was never locked. It is only there for the look.',
        'Take one. Go on. Nobody is watching. Probably.',
      ],
      moreLabel: 'ENOUGH COOKIES',
      empty: 'The jar is empty. You are the evidence now.',
    },

    ascii: {
      label: 'Look at the framed cat',
      lines: [
        'A framed picture of a cat. The cat is unimpressed.',
        'Wherever your light falls, the picture turns into letters. Only there, and only while it lasts.',
        'Wave the lantern over its face. It has seen worse.',
      ],
    },

    particles: {
      label: 'Watch the dust',
      lines: [
        'A glass case of drifting specks. They follow your light like a very small, very loyal swarm.',
        'No point to it at all. That is the point.',
      ],
    },

    renderer: {
      label: 'Grab the old screen',
      intro: [
        'A chunky old screen spinning a wireframe. The 3D maths is real. The screen is tired.',
        'Grab it with the mouse or a finger, or nudge it with the choices below.',
      ],
      left: 'SPIN LEFT',
      right: 'SPIN RIGHT',
      up: 'TILT UP',
      down: 'TILT DOWN',
      leaveLabel: 'LET GO',
      pop: 'Now and then a corner pokes through the cube. The maths was never told it could not.',
    },

    monster: {
      label: 'Look closer at the eyes',
      lines: [
        'Two red eyes in the dark. Your heart does a small, polite jump.',
        'You step closer. It is a poster.',
        'A green monster, a great deal of eyebrow, and tape that has seen better decades.',
        'Underneath, in biro: "This is not what I look like."',
        'You believe it. Mostly.',
      ],
      again: ['The poster glares. It is paper. The tape is winning.'],
    },
  },

  /** The project panel: real facts from `src/data/projects.ts`, labels here. */
  projectPanel: {
    label: 'Project details',
    close: 'CLOSE',
    closeLabel: 'Close project details',
    repo: 'OPEN THE REPO',
    demo: 'TRY THE LIVE DEMO',
    builtWith: 'Built with',
  },

  /** The workshop under the hall: a cellar of half-finished machines. */
  workshop: {
    /** The open hatch in the hall's floor. */
    hatch: {
      label: 'Look down the hatch',
      lines: [
        'A hatch in the floor, propped open. Warm light and a smell of solder come up it.',
        'There is a ladder. It is a very small ladder, but it is a ladder.',
      ],
      goLabel: 'CLIMB DOWN',
      stayLabel: 'NOT YET',
      stayReply: ['Sure. Hatches are patient. It is most of what they do.'],
    },

    exit: {
      label: 'Climb back up',
      lines: ['The ladder back up to the hall. The hall is dark, but it is a familiar sort of dark.'],
      backLabel: 'CLIMB UP',
      stayLabel: 'NOT YET',
      stayReply: ['Stay and tinker. Nobody is timing you.'],
    },

    /** `ai-anime`: the rickety machine. Facts come from the project data. */
    aiAnime: {
      label: "Pull the machine's lever",
      pulled: 'The machine thinks about it, loudly, and then it makes something.',
      portraits: {
        'portrait-grin': 'A grinning face.',
        'portrait-owl': 'An owl who has seen things.',
        'portrait-cat': 'A cat, which is on brand.',
      },
      flaws: {
        'six-fingers': 'It has given the hand six fingers. Nobody asked for the sixth.',
        'three-eyes': 'There is a third eye on the forehead. It looks tired.',
        'crooked-smile': 'The smile has slid off to one side, like it is trying to leave.',
        'extra-ear': 'An extra ear on top. Very attentive, honestly.',
        'backwards-hand': 'A hand on backwards. Fingers down, vibes intact.',
      },
      verdict: 'Close enough. The machine looks very pleased with itself.',
      again: 'Another pull. The machine sighs, then gets on with it.',
    },
  },
} as const;
