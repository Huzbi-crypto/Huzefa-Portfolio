import { describe, expect, it } from 'vitest';
import { SPRITES } from './index';
import {
  AI_CANVAS,
  BELT_STATIONS,
  CAN_MOUTH,
  FLOW_BOARD_ORIGIN,
  WORKSHOP_NAMES,
} from './sprites/workshop';

describe('workshop art', () => {
  it('has_every_workshop_sprite', () => {
    for (const name of WORKSHOP_NAMES) expect(SPRITES[name], name).toBeDefined();
  });

  it('tiles_are_16_by_16_and_the_floor_is_not_the_halls_flagstone', () => {
    for (const name of ['workshopFloor', 'workshopFloorAlt', 'workshopWall', 'workshopWallBase']) {
      expect([SPRITES[name].w, SPRITES[name].h], name).toEqual([16, 16]);
    }
    expect(SPRITES.workshopFloor.pixels).not.toEqual(SPRITES.darkFloor.pixels);
  });

  it('the_machine_canvas_sits_inside_the_machine_sprite', () => {
    const machine = SPRITES.workshopMachine;
    expect(AI_CANVAS.x + AI_CANVAS.w).toBeLessThanOrEqual(machine.w);
    expect(AI_CANVAS.y + AI_CANVAS.h).toBeLessThanOrEqual(machine.h);
    expect(AI_CANVAS.w).toBe(24);
    expect(AI_CANVAS.h).toBe(24);
  });

  it('the_two_lever_poses_and_two_gear_frames_share_sizes', () => {
    expect([SPRITES.workshopLeverUp.w, SPRITES.workshopLeverUp.h]).toEqual([
      SPRITES.workshopLeverDown.w,
      SPRITES.workshopLeverDown.h,
    ]);
    expect([SPRITES.workshopGear0.w, SPRITES.workshopGear0.h]).toEqual([
      SPRITES.workshopGear1.w,
      SPRITES.workshopGear1.h,
    ]);
  });

  it('the_flow_board_leaves_room_for_every_robot', () => {
    const board = SPRITES.workshopFlowBoard;
    expect(FLOW_BOARD_ORIGIN.x).toBeGreaterThanOrEqual(0);
    expect(board.w).toBeGreaterThanOrEqual(140);
  });

  it('the_can_mouth_is_inside_the_can', () => {
    const can = SPRITES.workshopCan;
    expect(CAN_MOUTH.x).toBeLessThan(can.w);
    expect(CAN_MOUTH.y).toBeLessThan(can.h);
  });

  it('the_belt_has_four_stations_that_fit_along_it', () => {
    expect(BELT_STATIONS).toHaveLength(4);
    const belt = SPRITES.workshopBelt0;
    for (const x of BELT_STATIONS) expect(x + SPRITES.workshopStation.w).toBeLessThanOrEqual(belt.w);
    expect([SPRITES.workshopBelt1.w, SPRITES.workshopBelt1.h]).toEqual([belt.w, belt.h]);
  });

  it('the_hatch_and_the_ladder_are_a_matched_pair_of_ways_through', () => {
    expect(SPRITES.workshopHatch.w).toBeGreaterThanOrEqual(24);
    expect(SPRITES.workshopLadder.h).toBeGreaterThanOrEqual(32);
  });
});
