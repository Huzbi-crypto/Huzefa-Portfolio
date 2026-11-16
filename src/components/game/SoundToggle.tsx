'use client';

import { useEffect, useRef } from 'react';
import { copy } from '@/game/content/copy';
import { stopEventsAtButton } from './buttonEvents';

const SCALE = 3;

/** A tiny speaker, drawn from square pixels like everything else in the HUD. */
const OFF = [
  '....##......',
  '...###......',
  '#######.....',
  '#######.....',
  '#######.....',
  '...###......',
  '....##......',
];

const ON = [
  '....##...##.',
  '...###..##..',
  '#######.##..',
  '#######.##..',
  '#######.##..',
  '...###..##..',
  '....##...##.',
];

function PixelSpeaker({ on }: { on: boolean }) {
  const grid = on ? ON : OFF;
  const cells: React.ReactNode[] = [];
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    });
  });

  return (
    <svg
      className="sound-icon"
      width={13 * SCALE}
      height={7 * SCALE}
      viewBox="0 0 13 7"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

/** Sound is off until the visitor says otherwise, and the choice is visible. */
export function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Native listeners on the button itself beat the game's listener on the
  // stage. React's handlers are delegated high above it, so they arrive late.
  // Arrows and WASD still reach the game while the toggle has focus: only
  // Enter and Space stop here.
  useEffect(() => {
    const button = ref.current;
    if (!button) return;
    return stopEventsAtButton(button);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className="sound-toggle px-panel"
      data-on={enabled}
      aria-pressed={enabled}
      aria-label={enabled ? copy.ui.soundOnLabel : copy.ui.soundOffLabel}
      onClick={onToggle}
    >
      <PixelSpeaker on={enabled} />
      <span aria-hidden="true">{enabled ? copy.ui.soundOn : copy.ui.soundOff}</span>
    </button>
  );
}
