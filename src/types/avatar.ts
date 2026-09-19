export type AvatarHotspotId =
  | 'desk-monitor'
  | 'desk-laptop'
  | 'bookshelf-stand'
  | 'mascot-pet'
  | 'window-gaze'
  | 'idle-chill';

export type AvatarActionState =
  | 'idle'
  | 'walking'
  | 'watching'
  | 'typing'
  | 'reading'
  | 'petting'
  | 'gazing';

export interface HotspotCoordinates {
  id: AvatarHotspotId;
  x: number; // percentage from left (0 - 100)
  bottom: number; // percentage from bottom (0 - 100)
  zIndex: number;
  facing: 'left' | 'right' | 'front';
  action: AvatarActionState;
  bubbleAnchor: 'top-left' | 'top-right' | 'top-center';
  label: string;
}

export const ROOM_HOTSPOTS: Record<AvatarHotspotId, HotspotCoordinates> = {
  'desk-monitor': {
    id: 'desk-monitor',
    x: 49,
    bottom: 29,
    zIndex: 26,
    facing: 'front',
    action: 'watching',
    bubbleAnchor: 'top-center',
    label: 'CRT Battlestation',
  },
  'desk-laptop': {
    id: 'desk-laptop',
    x: 32,
    bottom: 29,
    zIndex: 22,
    facing: 'right',
    action: 'typing',
    bubbleAnchor: 'top-left',
    label: 'Coding Laptop',
  },
  'bookshelf-stand': {
    id: 'bookshelf-stand',
    x: 82,
    bottom: 24,
    zIndex: 24,
    facing: 'right',
    action: 'reading',
    bubbleAnchor: 'top-right',
    label: 'Manga Bookshelf',
  },
  'mascot-pet': {
    id: 'mascot-pet',
    x: 68,
    bottom: 16,
    zIndex: 32,
    facing: 'left',
    action: 'petting',
    bubbleAnchor: 'top-right',
    label: 'Sleeping Mascot',
  },
  'window-gaze': {
    id: 'window-gaze',
    x: 23,
    bottom: 39,
    zIndex: 12,
    facing: 'left',
    action: 'gazing',
    bubbleAnchor: 'top-left',
    label: 'Starry Sky Window',
  },
  'idle-chill': {
    id: 'idle-chill',
    x: 49,
    bottom: 27,
    zIndex: 25,
    facing: 'front',
    action: 'idle',
    bubbleAnchor: 'top-center',
    label: 'Desk Stool Chill',
  },
};
