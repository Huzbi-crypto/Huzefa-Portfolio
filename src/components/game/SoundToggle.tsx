'use client';

import { useEffect, useRef } from 'react';
import { copy } from '@/game/content/copy';

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

/** The button owns its input; a click here must never walk the visitor. */
function stopAtTheButton(event: Event): void {
  if (event.type === 'keydown' || event.type === 'keyup') {
    const key = (event as KeyboardEvent).key;
    // Arrows and WASD still reach the game while the toggle has focus.
    if (key !== 'Enter' && key !== ' ') return;
  }
  event.stopPropagation();
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
  useEffect(() => {
    const button = ref.current;
    if (!button) return;

    const types = ['pointerdown', 'pointerup', 'pointermove', 'keydown', 'keyup'] as const;
    for (const type of types) button.addEventListener(type, stopAtTheButton);

    return () => {
      for (const type of types) button.removeEventListener(type, stopAtTheButton);
    };
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
