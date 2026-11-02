'use client';

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
function keepToTheButton(event: React.SyntheticEvent): void {
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
  return (
    <button
      type="button"
      className="sound-toggle px-panel"
      data-on={enabled}
      aria-pressed={enabled}
      aria-label={enabled ? copy.ui.soundOnLabel : copy.ui.soundOffLabel}
      onClick={onToggle}
      onPointerDown={keepToTheButton}
      onPointerUp={keepToTheButton}
      onPointerMove={keepToTheButton}
      onKeyDown={keepToTheButton}
      onKeyUp={keepToTheButton}
    >
      <PixelSpeaker on={enabled} />
      <span aria-hidden="true">{enabled ? copy.ui.soundOn : copy.ui.soundOff}</span>
    </button>
  );
}
