export type MangaSeries = 'one-piece' | 'naruto' | 'bleach' | 'black-clover' | 'one-punch-man';

export interface MangaMeta {
  id: MangaSeries;
  name: string;
  badge: string;
  themeColor: string;
  accentColor: string;
}

export const MANGA_SERIES_LIST: MangaMeta[] = [
  {
    id: 'one-piece',
    name: 'One Piece',
    badge: 'GEAR 5 // SUN GOD NIKA',
    themeColor: '#D97706',
    accentColor: '#FBBF24',
  },
  {
    id: 'naruto',
    name: 'Naruto',
    badge: 'KONOHA // WILL OF FIRE',
    themeColor: '#EA580C',
    accentColor: '#FB923C',
  },
  {
    id: 'bleach',
    name: 'Bleach',
    badge: 'SOUL SOCIETY // BANKAI',
    themeColor: '#2563EB',
    accentColor: '#60A5FA',
  },
  {
    id: 'black-clover',
    name: 'Black Clover',
    badge: 'BLACK BULLS // ANTI-MAGIC',
    themeColor: '#991B1B',
    accentColor: '#F87171',
  },
  {
    id: 'one-punch-man',
    name: 'One Punch Man',
    badge: 'HERO ASSOC // SAITAMA',
    themeColor: '#CA8A04',
    accentColor: '#FDE047',
  },
];

export const MANGA_DIALOGUES: Record<MangaSeries, string[]> = {
  'one-piece': [
    "One Piece: Oda dropping Void Century lore at 2 AM is absolute peak fiction.",
    "One Piece: The Drums of Liberation! Gear 5 Luffy laughing freely across the battlefield.",
    "One Piece: Zoro standing bloody in front of Kuma... 'Nothing happened.' Pure goosebumps.",
    "One Piece: 'He laughed.' Roger reaching Laugh Tale remains the most poetic scene in manga.",
  ],
  'naruto': [
    "Naruto: Jiraiya the Gallant... reading his final chapter late at night always hits right in the feels.",
    "Naruto: Pain hovering over Konoha: 'Those who do not understand true pain can never understand true peace.'",
    "Naruto: Itachi bore all the darkness alone so the village could see the dawn. Greatest shinobi.",
    "Naruto: Might Guy unleashing the 8th Gate of Death... the Crimson Beast of the Leaf!",
  ],
  'bleach': [
    "Bleach: Ichigo whispering 'Bankai... Tensa Zangetsu' with Number One playing in my head.",
    "Bleach: Aizen stopping Ichigo's sword with a single index finger was the ultimate flex.",
    "Bleach: Yamamoto: 'Zanka no Tachi... East, West, South, North.' Pure raw power.",
    "Bleach: Tite Kubo's volume poems and panel compositions are straight modern art.",
  ],
  'black-clover': [
    "Black Clover: 'My magic is never giving up!' Asta's demonic anti-magic grind is unmatched.",
    "Black Clover: Captain Yami: 'Surpass your limits right here, right now.' Best debugging motto ever.",
    "Black Clover: Magna Swing vs Dante... pure human grit beating god-tier hacks.",
    "Black Clover: Nacht's shadow devils and the Black Bulls crashing the party to save family.",
  ],
  'one-punch-man': [
    "One Punch Man: Murata's double-page spreads are drawn with unfathomable god-tier detail.",
    "One Punch Man: Serious Punch Squared bending space and destroying stars on Io.",
    "One Punch Man: The King Engine rumbling at maximum volume while King is internally crying.",
    "One Punch Man: Cosmic Fear Garou vs Saitama: a single sneeze blew away Jupiter's atmosphere.",
  ],
};

export const CODING_DIALOGUES: string[] = [
  "laptop: Dijkstra SPF priority queue running with zero latency. Graph traversal locked in.",
  "laptop: 0 warnings, 0 errors. Compiling C at 2 AM feels like pure sorcery.",
  "laptop: Debugging the AST parser... finally emitting clean bytecode instructions.",
  "laptop: Packet routing simulation: zero dropped frames across all network hops.",
  "laptop: Just pushed commit 'fixed off-by-one error (again)'. CI pipeline is green.",
  "laptop: Custom terminal emulator coming along. Retro scanlines make everything faster.",
  "laptop: Memory footprint down to 12KB. Pointer arithmetic is deeply satisfying.",
  "laptop: Reverse engineering network protocols late at night with hot chai. Peak flow state.",
  "laptop: One more function to refactor, then calling it a night. (Who am I kidding?)",
  "laptop: Linux kernel logs looking pristine. Everything's running like clockwork.",
];
