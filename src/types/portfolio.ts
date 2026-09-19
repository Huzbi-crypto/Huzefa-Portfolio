export type Theme = 'cozy-crt' | 'warm-apartment' | 'moonlit-terminal';

export type VisualArtifactKind = 
  | 'cartridge'  // Retro game cartridge
  | 'terminal'   // CRT / serial terminal prompt
  | 'network'    // Network router / switch simulation board
  | 'machine'    // Machine learning / neural accelerator
  | 'module'     // Agentic pipeline module
  | 'book'       // Physical book / manga volume
  | 'canvas';    // Generative / creative canvas

export interface ProjectVisual {
  type: VisualArtifactKind;
  accentColor: string; // Hex color or token
  icon?: string;       // Identifier for Lucide icon
  asciiBadge: string;  // e.g. "[ROM]", "[TTY]", "[NET]", "[AI]"
  label: string;       // Human readable visual descriptor
}

export type ProjectCategory = 
  | 'featured'
  | 'systems-network'
  | 'ai-ml'
  | 'creative-terminal'
  | 'experiment'
  | 'archive';

export interface Project {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  languages: string[];
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  stars: number;
  forks?: number;
  featured: boolean;
  order: number;
  visual: ProjectVisual;
  highlights?: string[];
  dateCreated?: string;
}

export type CharacterAction = 
  | 'idle'
  | 'looking'
  | 'typing'
  | 'reading'
  | 'thinking'
  | 'sleeping';

export interface CharacterState {
  state: CharacterAction;
  direction: 'left' | 'right';
  interactive?: boolean;
}

export interface ReadingItem {
  title: string;
  type: 'manga' | 'novel' | 'book' | 'tech';
  author?: string;
  status: 'reading' | 'completed' | 'favorite';
  note?: string;
}

export interface PersonalInfo {
  name: string;
  handle: string;
  legalName: string;
  title: string;
  bio: string;
  shortBio: string;
  roomAtmosphere: string;
  location: string;
  education: {
    degree: string;
    institution: string;
    focus: string;
  };
  email: string;
  socials: {
    github: string;
    twitter: string;
    linkedin: string;
    myanimelist: string;
  };
  interests: string[];
  currentFocus: string[];
  readingList: ReadingItem[];
}
