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
    x: 47,
    bottom: 27,
    zIndex: 35,
    facing: 'front',
    action: 'watching',
    bubbleAnchor: 'top-center',
    label: 'CRT Terminal',
  },
  'desk-laptop': {
    id: 'desk-laptop',
    x: 35,
    bottom: 24,
    zIndex: 35,
    facing: 'left',
    action: 'typing',
    bubbleAnchor: 'top-left',
    label: 'Coding Laptop',
  },
  'bookshelf-stand': {
    id: 'bookshelf-stand',
    x: 77,
    bottom: 22,
    zIndex: 28,
    facing: 'right',
    action: 'reading',
    bubbleAnchor: 'top-left',
    label: 'Manga Bookshelf',
  },
  'mascot-pet': {
    id: 'mascot-pet',
    x: 74,
    bottom: 7,
    zIndex: 45,
    facing: 'right',
    action: 'petting',
    bubbleAnchor: 'top-left',
    label: 'Sleeping Mascot',
  },
  'window-gaze': {
    id: 'window-gaze',
    x: 23,
    bottom: 29,
    zIndex: 35,
    facing: 'left',
    action: 'gazing',
    bubbleAnchor: 'top-right',
    label: 'Night Window',
  },
  'idle-chill': {
    id: 'idle-chill',
    x: 47,
    bottom: 27,
    zIndex: 35,
    facing: 'front',
    action: 'idle',
    bubbleAnchor: 'top-center',
    label: 'Desk Stool',
  },
};
