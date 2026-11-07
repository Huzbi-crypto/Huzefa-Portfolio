export type ChoiceDirection = 'up' | 'down' | 'left' | 'right';

/** The laid-out box of one choice, as the browser reports it. */
export type ChoiceBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Which choice an arrow key should move to, given the boxes the browser laid
 * out. The old rule was linear: every arrow meant next/previous, so in a
 * wrapped row of controls, pressing Down from a movement button skipped along
 * the row instead of reaching the exit button below it.
 *
 * This follows the screen instead: left/right/up/down pick the nearest choice
 * in that direction, with the perpendicular distance as a tie-breaker. If
 * there is nothing in that direction, Down goes to the last choice (normally
 * the leave/back option), Up to the first, and left/right wrap the row.
 */
export function choiceInDirection(
  current: number,
  boxes: readonly ChoiceBox[],
  direction: ChoiceDirection,
): number {
  if (boxes.length === 0) return current;

  const from = boxes[current];
  if (!from) return current;

  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const horizontal = direction === 'left' || direction === 'right';
  let best = current;
  let bestScore = Number.POSITIVE_INFINITY;

  boxes.forEach((box, index) => {
    if (index === current) return;

    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const dx = x - fromX;
    const dy = y - fromY;
    const inDirection =
      direction === 'left'
        ? dx < -1
        : direction === 'right'
          ? dx > 1
          : direction === 'up'
            ? dy < -1
            : dy > 1;
    if (!inDirection) return;

    // The main axis decides the move; the other axis keeps it on the nearest
    // row or column instead of jumping diagonally across the panel.
    const primary = horizontal ? Math.abs(dx) : Math.abs(dy);
    const secondary = horizontal ? Math.abs(dy) : Math.abs(dx);
    const score = primary + secondary * 2;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });

  if (best !== current) return best;

  // Nothing in that direction. The last choice is conventionally the safe
  // one in this game, so Down is a one-press exit; Up returns to the start.
  if (direction === 'down') return boxes.length - 1;
  if (direction === 'up') return 0;
  if (direction === 'right') return 0;
  return boxes.length - 1;
}
