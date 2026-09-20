export type AvatarHotspotId =
  | 'desk-monitor'
  | 'desk-laptop'
  | 'bookshelf-stand'
  | 'mascot-pet'
  | 'window-gaze'
  | 'sofa-chill'
  | 'idle-chill';

export type AvatarActionState =
  | 'idle'
  | 'walking'
  | 'watching'
  | 'typing'
  | 'reading'
  | 'petting'
  | 'gazing'
  | 'humming';

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
    zIndex: 45,
    facing: 'front',
    action: 'watching',
    bubbleAnchor: 'top-center',
    label: 'CRT Terminal',
  },
  'desk-laptop': {
    id: 'desk-laptop',
    x: 34,
    bottom: 22,
    zIndex: 45,
    facing: 'left',
    action: 'typing',
    bubbleAnchor: 'top-left',
    label: 'Coding Laptop',
  },
  'bookshelf-stand': {
    id: 'bookshelf-stand',
    x: 71,
    bottom: 12,
    zIndex: 45,
    facing: 'right',
    action: 'reading',
    bubbleAnchor: 'top-left',
    label: 'Manga Bookshelf',
  },
  'mascot-pet': {
    id: 'mascot-pet',
    x: 74,
    bottom: 5,
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
    zIndex: 45,
    facing: 'left',
    action: 'gazing',
    bubbleAnchor: 'top-right',
    label: 'Night Window',
  },
  'sofa-chill': {
    id: 'sofa-chill',
    x: 48,
    bottom: 21,
    zIndex: 45,
    facing: 'front',
    action: 'humming',
    bubbleAnchor: 'top-center',
    label: 'Comfy Sofa',
  },
  'idle-chill': {
    id: 'idle-chill',
    x: 48,
    bottom: 21,
    zIndex: 45,
    facing: 'front',
    action: 'humming',
    bubbleAnchor: 'top-center',
    label: 'Comfy Sofa',
  },
};
