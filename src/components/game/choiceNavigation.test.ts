import { describe, expect, it } from 'vitest';
import { choiceInDirection, type ChoiceBox } from './choiceNavigation';

const rowAndExit: ChoiceBox[] = [
  { left: 0, top: 0, width: 120, height: 44 },
  { left: 132, top: 0, width: 120, height: 44 },
  { left: 264, top: 0, width: 120, height: 44 },
  { left: 396, top: 0, width: 120, height: 44 },
  { left: 0, top: 56, width: 120, height: 44 },
];

describe('choiceInDirection', () => {
  it('down_from_any_movement_button_reaches_the_exit_below', () => {
    for (const index of [0, 1, 2, 3]) {
      expect(choiceInDirection(index, rowAndExit, 'down')).toBe(4);
    }
  });

  it('up_from_the_exit_returns_to_the_nearest_button_above', () => {
    expect(choiceInDirection(4, rowAndExit, 'up')).toBe(0);
  });

  it('left_and_right_follow_the_rendered_row', () => {
    expect(choiceInDirection(0, rowAndExit, 'right')).toBe(1);
    expect(choiceInDirection(1, rowAndExit, 'right')).toBe(2);
    expect(choiceInDirection(2, rowAndExit, 'left')).toBe(1);
  });

  it('left_and_right_wrap_when_there_is_no_neighbour', () => {
    expect(choiceInDirection(3, rowAndExit, 'right')).toBe(0);
    expect(choiceInDirection(0, rowAndExit, 'left')).toBe(4);
    const rowOnly = rowAndExit.slice(0, 4);
    expect(choiceInDirection(3, rowOnly, 'right')).toBe(0);
    expect(choiceInDirection(0, rowOnly, 'left')).toBe(3);
  });

  it('a_two_row_grid_moves_down_the_same_column', () => {
    const grid: ChoiceBox[] = [
      { left: 0, top: 0, width: 120, height: 44 },
      { left: 132, top: 0, width: 120, height: 44 },
      { left: 0, top: 56, width: 120, height: 44 },
      { left: 132, top: 56, width: 120, height: 44 },
    ];
    expect(choiceInDirection(0, grid, 'down')).toBe(2);
    expect(choiceInDirection(1, grid, 'down')).toBe(3);
    expect(choiceInDirection(2, grid, 'up')).toBe(0);
    expect(choiceInDirection(3, grid, 'up')).toBe(1);
  });

  it('a_vertical_menu_moves_one_row_at_a_time', () => {
    const column: ChoiceBox[] = [
      { left: 0, top: 0, width: 160, height: 44 },
      { left: 0, top: 56, width: 160, height: 44 },
      { left: 0, top: 112, width: 160, height: 44 },
    ];
    expect(choiceInDirection(0, column, 'down')).toBe(1);
    expect(choiceInDirection(1, column, 'down')).toBe(2);
    expect(choiceInDirection(2, column, 'up')).toBe(1);
    expect(choiceInDirection(0, column, 'up')).toBe(0);
  });

  it('down_with_no_choice_below_still_takes_the_exit', () => {
    expect(choiceInDirection(4, rowAndExit, 'down')).toBe(4);
  });
});
