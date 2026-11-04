'use client';

import { useApp } from '@/context/AppContext';
import { PALETTES } from '@/game/art/palette';

type Props = {
  /** Rows of palette keys; `.` is transparent. */
  grid: readonly string[];
  /** Whole-number size of one art pixel, in CSS pixels. */
  scale?: number;
  /** Set when the art says something; leave out when it only decorates. */
  label?: string;
  className?: string;
};

/**
 * Draws a character grid as crisp SVG. Runs of one colour are merged, so a
 * 24 by 38 door is a few dozen path segments and not a thousand rects.
 */
export function PixelArt({ grid, scale = 4, label, className }: Props) {
  const { theme } = useApp();
  const palette = PALETTES[theme];
  const width = Math.max(...grid.map((row) => row.length));
  const height = grid.length;
  const byColor = new Map<string, string>();

  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      const color = palette[key];
      if (key === '.' || !color) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < row.length && row[end] === key) end += 1;
      byColor.set(color, `${byColor.get(color) ?? ''}M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });

  return (
    <svg
      className={className ? `pixel-art ${className}` : 'pixel-art'}
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {Array.from(byColor, ([color, d]) => (
        <path key={color} d={d} fill={color} />
      ))}
    </svg>
  );
}
