'use client';

import { useEffect, useRef, useState } from 'react';
import { copy } from '@/game/content/copy';

const STAR_SCALE = 3;

/** A 9 by 9 pixel star for the HUD, drawn as crisp SVG squares. */
const STAR = [
  '....#....',
  '...###...',
  '#########',
  '.#######.',
  '..#####..',
  '..#####..',
  '.###.###.',
  '.##...##.',
  '.#.....#.',
];

function PixelStar() {
  const cells: React.ReactNode[] = [];
  STAR.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    });
  });
  return (
    <svg
      className="star-icon"
      width={9 * STAR_SCALE}
      height={9 * STAR_SCALE}
      viewBox="0 0 9 9"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

/** Stars found so far. Bumps once each time a new one is earned. */
export function StarCounter({ found, total }: { found: number; total: number }) {
  const previous = useRef(found);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (found > previous.current) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 500);
      previous.current = found;
      return () => window.clearTimeout(timer);
    }
    previous.current = found;
  }, [found]);

  return (
    <div
      className="star-counter px-panel"
      data-bump={bump}
      role="status"
      aria-label={`${copy.ui.starCounter}: ${found} of ${total}`}
    >
      <PixelStar />
      <span aria-hidden="true">
        {found}/{total}
      </span>
    </div>
  );
}
