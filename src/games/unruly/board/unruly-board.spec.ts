import { outlines } from './unruly-board';

describe('Unruly mistake outlines', () => {
  it('merge overlapping three-in-a-rows in the same line', () => {
    // On an 8-wide board: four across from (2, 0), three across from (0, 3),
    // and five down from (7, 1).
    const runs = [
      { start: 2, horizontal: true },
      { start: 3, horizontal: true },
      { start: 24, horizontal: true },
      { start: 15, horizontal: false },
      { start: 23, horizontal: false },
      { start: 31, horizontal: false },
    ];
    expect(outlines(runs, 8)).toEqual([
      { x: 2, y: 0, w: 4, h: 1 },
      { x: 0, y: 3, w: 3, h: 1 },
      { x: 7, y: 1, w: 1, h: 5 },
    ]);
  });

  it('keep separate runs in the same line apart', () => {
    // 1 1 1 0 1 1 1 on a row: two runs, not one.
    expect(
      outlines(
        [
          { start: 0, horizontal: true },
          { start: 4, horizontal: true },
        ],
        8,
      ),
    ).toEqual([
      { x: 0, y: 0, w: 3, h: 1 },
      { x: 4, y: 0, w: 3, h: 1 },
    ]);
  });
});
