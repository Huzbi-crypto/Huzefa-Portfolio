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
    nudge: 'Psst. Something nearby is worth a look.',
    nudgeTarget: (label: string) => `Psst. ${label}.`,
  },

  /** The in-game journal. Entries for stars not found yet stay hidden. */
  journal: {
    button: 'JOURNAL',
    buttonLabel: 'Open the journal. Shortcut: J.',
    title: 'Journal',
    close: 'CLOSE',
    closeLabel: 'Close the journal',
    count: (found: number, total: number) => `${found} of ${total} found`,
    hiddenTitle: '???',
    hiddenBody: 'Not found yet. Keep poking around.',
    sections: { projects: 'Things Huzbi built', books: 'The shelf', silly: 'Silly things' },
    repo: 'Repo',
    page: 'Full page',
    fallbackBody: 'You found this one. It is too silly to describe.',
    /** One line per silly star, in Huzbi's voice, for Huzbi to edit. */
    silly: {
      'silly:pet-cat': { title: 'Ten pets', body: 'You petted the cat ten times. It has decided you can stay.' },
      'silly:cold-tea': { title: 'Cold tea', body: 'A mug with a skin on it. Not five minutes ago, then.' },
      'silly:read-note': { title: 'The note', body: '"Back in 5 mins. Don\'t touch anything." You touched it.' },
      'silly:monster-poster': { title: 'The red eyes', body: 'Two red eyes in the dark. A poster. Huzbi is a green monster, apparently.' },
      'silly:sofa': { title: 'The sofa', body: 'It has a Huzbi-shaped dent. You are not the right shape.' },
      'silly:lamp': { title: 'The lamp', body: 'You switched it off and on. Nothing changed. Decorative, with ambitions.' },
      'silly:rug': { title: 'Under the rug', body: 'You looked under the rug. Floor.' },
      'silly:note-thrice': { title: 'The note, again, again', body: 'You read the same note three times. It still says the same thing.' },
      'silly:drink-tea': { title: 'You drank the tea', body: 'Cold, bitter and old. Nobody asked you to.' },
      'silly:wave-at-sky': { title: 'Waving at the sky', body: 'You waved at the night sky five times. A star twinkled, which counts.' },
      'silly:door-chicken': { title: 'Chicken', body: 'You said STAY at the door three times. The door noticed.' },
      'silly:terminal-secret': {
        title: 'xyzzy',
        body: 'You typed the oldest cheat code into a stranger\'s terminal. Nothing happened, except a star.',
      },
    } as Record<string, { title: string; body: string }>,
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
    /** The shelf has three rows; the visitor picks a row, then a spine. */
    menu: ['Three rows of spines, all of them well thumbed.', 'Which row?'],
    rowLabels: ['TOP ROW', 'MIDDLE ROW', 'BOTTOM ROW'],
    nextLabel: 'WHATEVER IS NEXT',
    leaveLabel: 'LEAVE IT',
    backLabel: 'BACK',
    which: 'Which one?',
    readMark: '(read)',
  },

  /** More silly things to touch in the room. Each earns its own star. */
  sofa: {
    label: 'Sit on the sofa',
    lines: [
      'You sit. The sofa has a Huzbi-shaped dent and you are not it.',
      'It is comfortable in a way that feels like a warning.',
    ],
    again: ['You sit again. The sofa accepts you, lightly.'],
  },

  lamp: {
    label: 'Fiddle with the lamp',
    lines: [
      'You switch the lamp off. The room does not change at all.',
      'You switch it on. Still nothing. This lamp is a decoration with ambitions.',
    ],
    again: ['The lamp is on. Probably.'],
  },

  rug: {
    label: 'Check the rug',
    lines: [
      'You lift a corner of the rug.',
      'Under it: a floor. Underneath the floor, presumably, more floor.',
    ],
    again: ['You put the corner back. The rug has seen you.'],
  },

  noteThrice: {
    lines: [
      'You read the note a third time.',
      '"Back in 5 mins. Don\'t touch anything."',
      'It has not changed. You are the only thing that has changed, a little, in the eyes.',
    ],
    again: ['Back in 5 mins. You know this. We both know this.'],
  },

  drinkTea: {
    lines: [
      'You drink the tea.',
      'It is cold, a bit bitter and quite old. Somehow it still tastes like a decision.',
    ],
    again: ['The mug is empty now. Respect, and also concern.'],
  },

  waveAtSky: {
    lines: [
      'You wave at the night sky. Five times, with feeling.',
      'The sky does not wave back. A star twinkles, which is almost the same thing.',
    ],
    again: ['The sky is waving back, in the sense that it is not moving.'],
  },

  doorChicken: {
    lines: [
      'You stay out for the third time.',
      'The door says nothing, loudly. Chicken.',
    ],
    again: ['Still outside. The door is patient.'],
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
      /** The little DOM prompt, which is the terminal's real keyboard. */
      promptLabel: 'The little terminal',
      promptKicker: 'huzbi@room:~$',
      promptInputLabel: 'Type a command at the little terminal',
      promptHint: 'Type a command and press Enter. Esc gets you out.',
      promptChoicesLabel: 'No keyboard? Tap one of these.',
      promptClose: 'CLOSE',
      promptCloseLabel: 'Close the little terminal',
      promptOutputLabel: 'Terminal output',
      promptCommand: (line: string) => `> ${line}`,
      promptEmpty: 'Say something. It is waiting.',
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
      spun: ['Round it goes.', 'And round again.', 'Still going. It has nowhere else to be.'],
      pop: 'Now and then a corner pokes through the cube. The maths was never told it could not.',
    },

    /** What the little shell and the jar say, read by their logic modules. */
    shell: {
      help: [
        'help    - read this, then forget it',
        'ls      - list the evidence',
        'cat     - read a file',
        'whoami  - ask a question you will regret',
        'clear   - wipe the screen, not the guilt',
      ],
      ls: ['nothing', 'a cat', 'a suspiciously empty folder'],
      catWhich: 'cat: which file? Use your words.',
      catDenied: (file: string) => `cat: ${file}: permission denied. Nice try.`,
      whoami: 'A visitor with too much time.',
      clear: 'The screen is no cleaner. You are.',
      unknown: (command: string) => `${command}? That is not a command. It is barely a word.`,
    },

    jar: {
      evidence: 'Please stop eating the evidence.',
      empty: 'The jar is empty. The evidence is in you now.',
      missing: 'That cookie is not in the jar. It is in your heart.',
      cookies: [
        { id: 'session', label: 'session_id', note: 'Expires when you stop being curious.' },
        { id: 'auth', label: 'auth_token', note: 'Tastes like a password reset.' },
        { id: 'analytics', label: '_ga', note: 'Counts how many crumbs you drop.' },
        { id: 'csrf', label: 'csrf_token', note: 'Suspiciously crunchy, for a security measure.' },
        { id: 'theme', label: 'theme_pref', note: 'Dark. Obviously.' },
        { id: 'cart', label: 'cart_id', note: 'You never bought anything, so this is free.' },
      ],
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

    /** `lang-projects`: tiny robots passing a note round a flow chart. */
    lang: {
      label: 'Hand the robots a note',
      /** Chalked under each robot, capitals only. */
      labels: ['ASK', 'ROUTE', 'THINK', 'WRITE'],
      notes: ['"is this thing on?"', '"one coffee, please"', '"you are doing great"'],
      passed: 'The note goes hand to hand to hand and comes out the other end. Mostly intact.',
      again: 'Another note, another trip. They have a system. Ish.',
      loopBefore: 'The THINK robot has asked itself the same question',
      loopAfter: 'times now. It has not noticed the note go by.',
    },

    /** `speech-translator`: two tin cans on a string. */
    speech: {
      label: 'Talk into the tin can',
      prompt: 'Two tin cans on a string. One of them is plainly listening. Say something into the other.',
      phrases: [
        { id: 'hello', text: 'hello there' },
        { id: 'coffee', text: 'I need coffee' },
        { id: 'nap', text: 'wake me in five minutes' },
      ],
      heard: 'The other can says:',
      lost: 'Not quite what you said. Something is always lost in translation, and it is usually the point.',
      again: 'Different words again. The string has strong opinions.',
    },

    /** `compiler-project`: a conveyor belt with four stations. */
    compiler: {
      label: 'Drop a line onto the belt',
      prompt: 'A conveyor belt with four stations. Drop a line of code on and see what comes out.',
      lines: [
        { id: 'sum', text: 'x = 1 + 2' },
        { id: 'times', text: 'y = x * 4' },
        { id: 'messy', text: 'x = ( 1 +' },
      ],
      ok: 'Four stations, no complaints. Suspicious.',
      out: 'Out of the far end, as toy assembly:',
      jam: 'The belt stops with a clunk.',
      jamAfter: 'A small light blinks, cross. Give it a moment and a new line.',
    },
  },

  /**
   * The trail through the dark. Each scrap points at the next place to look,
   * and none of it is a puzzle: follow the paper. Placeholder voice, for Huzbi to edit.
   */
  clues: {
    note: {
      label: 'Read the second note',
      lines: [
        'A second sticky note, stuck beside the first, in smaller writing:',
        '"P.S. If you go into the dark, follow the chalk. And the paper."',
        'You have a feeling about that.',
      ],
      again: ['"Follow the chalk. And the paper." Yes. You heard.'],
    },
    hall: {
      label: 'Pick up the scrap of paper',
      lines: [
        'A scrap of paper, weighed down by a pebble:',
        '"Tools are under the floor. The hatch is the bit that looks like a hatch."',
      ],
      again: ['"The hatch is the bit that looks like a hatch." Down you go, then.'],
    },
    workshop: {
      label: 'Pick up the scrap of paper',
      lines: [
        'A scrap of paper, tucked into a jar of screws:',
        '"Filed the rest upstairs. By upstairs I mean the door standing on its own in the hall."',
      ],
      again: ['"The door standing on its own in the hall." You know the one.'],
    },
    archive: {
      label: 'Pick up the scrap of paper',
      lines: [
        'A scrap of paper, folded very small, tucked in a file box:',
        '"Last stop: the passage in the hall that smells of toast. It goes up. Look at the sky."',
        '"Ignore the poster. It is just a poster. It looks cross all the time."',
      ],
      again: ['"The passage that smells of toast. It goes up." And the poster is still just a poster.'],
    },
    observatory: {
      label: 'Look through the telescope',
      lines: [
        'You put your eye to the brass. A smudge, then a window, far off and lit.',
        'Through it: a sofa. On the sofa, a lump. On the lump, an open manga, face down.',
        'The lump rises and falls. Slowly. In no hurry at all.',
        'Behind you, a small door with a moon on it clicks. Unlocked.',
      ],
      again: ['The same far window. The same lump. The same slow breathing. The moon door stays unlocked.'],
    },
  },

  /** The Observatory: a room of sky, a star map of real repos, and a door with a moon on it. */
  observatory: {
    /** The passage up, from the hall. */
    arch: {
      label: 'Take the passage up',
      lines: [
        'The passage leans uphill. The smell of toast gets stronger.',
        'At the top, a round room, and a sky where the ceiling should be.',
      ],
      goLabel: 'GO UP',
      stayLabel: 'NOT YET',
      stayReply: ['Fair. Stairs are a commitment.'],
    },
    exit: {
      label: 'Back down to the hall',
      lines: ['The stairs back down to the hall, a little crooked, still warm from the toast.'],
      backLabel: 'GO BACK',
      stayLabel: 'NOT YET',
      stayReply: ['Stay and look up a while. That is what the room is for.'],
    },
    /** Painted on the wall in chalk, capitals only. */
    chalk: ['LOOK UP', 'ZZZ'],

    sky: {
      label: 'Look up at the sky',
      lines: (found: number, total: number): string[] => [
        'The same sky as the room windows, only closer.',
        found === 0
          ? 'Not one of your stars is lit yet. The faint dots are where they will go.'
          : `${found} of ${total} stars lit, each one something you found.`,
      ],
      again: (found: number, total: number): string[] => [`${found} of ${total} lit. The faint ones are still waiting.`],
    },

    map: {
      label: 'Read the star map',
      intro: [
        'A round table with a glass top, and a map of stars under it.',
        'Every star is a real repo. The brighter, the more people starred it.',
      ],
      count: (n: number): string => `${n} repos in all.`,
      brightest: (name: string, stars: number): string =>
        `Brightest: ${name}, with ${stars} ${stars === 1 ? 'star' : 'stars'}.`,
      again: ['The map has not moved. The repos keep being repos.'],
    },

    stats: {
      label: 'Read the plaque',
      intro: 'A brass plaque, polished by somebody who cares more than they let on.',
      /** Real numbers with the day they were fetched, cached from the GitHub API. */
      numbers: (repos: number, stars: number, followers: number, date: string): string =>
        `As of ${date}: ${repos} public repos, ${stars} stars received, ${followers} followers.`,
      note: 'Live from GitHub, cached hourly. The date above is when these numbers were fetched.',
      languages: (top: string): string => `Most of it is ${top}.`,
    },

    napDoor: {
      label: 'Try the door with the moon',
      shut: [
        'A small round door with a moon on it. A sign: "SHH. Back in 5 mins."',
        'It does not budge. The latch hums, sleepy, as if it is waiting for something.',
      ],
      /** One hint per clue, naming where to look, so a shut door is never a dead end. */
      hints: {
        'clue:note': 'Maybe the note in the room has more to say. The sticky one by the door.',
        'clue:hall': 'There is paper lying around the hall in the dark. Look near the hatch.',
        'clue:workshop': 'Something is tucked away in the workshop below the hatch.',
        'clue:archive': 'The Archive has one more scrap, folded small, in a file box.',
        'clue:observatory': 'The telescope is pointing at something. Have a look through it.',
      } as Record<string, string>,
      open: [
        'The latch clicks. The door swings in a crack. Warm light, and the slow sound of someone breathing.',
      ],
      goLabel: 'GO IN, QUIETLY',
      stayLabel: 'NOT YET',
      stayReply: ['Take your time. They are not going anywhere. Obviously.'],
    },
  },

  /** The nap room and the ending. The joke: the big mystery is a nap. */
  nap: {
    exit: {
      label: 'Back to the observatory',
      lines: ['The little round door with the moon on it, still ajar.'],
      backLabel: 'TIPTOE OUT',
      stayLabel: 'STAY',
      stayReply: ['Take a seat. Quietly.'],
    },
    chalk: ['SHH'],
    sleeper: {
      label: 'Look at the sleeper',
      look: [
        'Huzbi, asleep on the sofa. Round glasses shoved up into a bush of hair, a cardigan the size of a small tent, headphones hung round their neck like a stethoscope.',
        'A manga lies open on their face, rising and falling with every breath.',
        'The tiny desk lamp is on. So is the whole mystery.',
      ],
      wakeLabel: 'WAKE THEM',
      leaveLabel: 'LET THEM SLEEP',
      leaveReply: ['Kind. The manga rises and falls. Nothing else happens, for a good while.'],
      /** The same sofa, the second time round: they have clearly been up. */
      lookAgain: [
        'Huzbi, asleep again. The manga is back on their face and the glasses are back in the hair, as if nothing happened.',
        'The tea on the arm of the sofa has stopped steaming. It has not stopped being tea.',
      ],
      stirAgain: ['You cough. This time it sounds a little like a doorbell. The sofa answers with a long, creaky stretch.'],
      slideAgain: ['The manga slides off again. It knows the way by now.'],
      sitUpAgain: ['One eye. Then the other. This time there is recognition, and a sigh.'],
      /** Said while they are mid-lean or mid-flop and cannot be talked to. */
      busy: ['They are in the middle of a manoeuvre with a manga. Give them a second.'],
      /** Comic beats between the sleeping and the speaking; the scene plays them. */
      stir: ['You cough, politely. On the sofa, something shifts, stretches and thinks about it.'],
      slide: ['The manga slides off and lands on the floor with a quiet, papery flop.'],
      sitUp: ['One eye opens. Then the other. Neither is pleased.'],
    },
    /** What Huzbi says, for the star count the visitor earned. */
    wake: {
      full: [
        '...huh?',
        '...',
        '...wait, you found everything?',
        'Nobody does that.',
        'I mean it. Nobody. I hid half of it from myself.',
      ],
      most: [
        '...huh? Oh.',
        'You found the way here. And most of the silly bits, too. Respect.',
        'There is still a bit more hiding in the dark. Come back for the proper version of this conversation.',
      ],
      few: [
        '...huh? Who is...',
        'You followed the paper and skipped nearly all the stars. Efficient. Possibly lazy. I approve.',
        'There is a lot still hiding in the dark. Collect them all and I will be properly impressed.',
      ],
    },
    /** The short version, once the visitor has already had this conversation. */
    again: {
      full: ['Oh, it is you again. Still cannot believe you found everything.'],
      most: ['Oh. You again. Good to see you. Go find the rest of the stars, then I will say the nice thing.'],
      few: ['Mm. You again. Still more in the dark than you have found, you know.'],
    },
    /** Woken a second time, or more: they remember you, and are not thrilled about the timing. */
    rewake: {
      opening: [
        ['Oh. You again.', 'I was reading. I was *so* close to the good chapter.'],
        ['...you again?', 'Give me five minutes. Five. I will be a person in five minutes.'],
        ['Mm. Hello again.', 'I was reading, and then I was not, and I am still working out how that happened.'],
      ],
      afterWake: [
        'Right. Since you are here again, the offer stands.',
        'Real email, real links, still no mystery.',
      ],
    },

    /** Huzbi sitting up with the manga: the reading loop is part of the room. */
    reading: {
      look: [
        'Huzbi is sitting up, glasses on, manga held like a shield.',
        'This is serious reading. A page turns with great dignity.',
      ],
      letLabel: 'LET THEM READ',
      askLabel: 'ASK WHAT IT IS',
      tapLabel: 'TAP THE PAGE',
      letReply: [
        ['You back away slowly. A page turns. Somewhere, a hero levels up.'],
        ['You leave them to it. The reading continues, uninterrupted and a little smug.'],
      ],
      ask: [
        ['"A man punches a problem until it leaves." They do not look up. "It is very good."'],
        ['"Same one. It got better. I did not expect it to get better."'],
        ['"If you ask again it becomes a different manga, out of spite."'],
      ],
      tap: [
        'You tap the top of the page. One eye appears over the edge, enlarged by the glasses.',
        '"I am awake. I am also reading. These are compatible."',
        'The page lowers like a drawbridge. Did you want something, or was that just the tap?',
      ],
      sayHiLabel: 'SAY HI',
      backLabel: 'BACK TO READING',
      backReply: ['The eye withdraws. The page goes back up. Nothing ever happened.'],
    },

    /** After the line: a real way to say hi. */
    afterWake: [
      'Anyway. Since you are here.',
      'If you want to say hi, this is where I actually read things. A real email, not a mystery.',
    ],
    sayHiLabel: 'SAY HI',
    sayHiReply: ['The card is open. Real email, real links, no more mystery. Take your time.'],
    leaveAloneLabel: 'LEAVE THEM BE',
    leaveAloneReply: ['Go on. They are already half asleep again.'],

    /** The mail that opens when the visitor says hi. */
    mail: {
      subject: 'Hi from your game',
      body: 'Hi Huzbi,\n\nI found the nap room.\n\n',
    },

    contact: {
      title: 'Say hi',
      lead: 'Real contact details, in case the nap was a lot.',
      emailLabel: 'Email',
      sayHi: 'Say hi by email',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      myanimelist: 'MyAnimeList',
      close: 'CLOSE',
      closeLabel: 'Close the contact card',
      dialogLabel: 'Contact details',
    },

    /** Silly things to poke in the nap room. */
    manga: {
      label: 'Look at the pile of manga',
      lines: ['A neat stack of manga next to a very untidy stack of manga.', 'Neither is dusty. This is a working nap.'],
      again: ['The same two stacks. The untidy one has grown.'],
    },
    clock: {
      label: 'Check the clock',
      lines: ['A wall clock. It says it has been five minutes.', 'The clock is wrong in a hopeful way.'],
      again: ['Still five minutes. Optimism is a kind of timekeeping.'],
    },
    cat: {
      label: 'Say hello to the cat',
      lines: ['The cat is curled on the rug, one amber eye open. It saw you coming ages ago.'],
      again: ['The cat closes its eye again. You are, apparently, fine.'],
    },
  },

} as const;
