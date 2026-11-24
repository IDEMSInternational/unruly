import { GeneratedPuzzle } from '@studio/engine/puzzle-game';
import { RandomState } from '@studio/engine/random/random-state';
import { shuffle } from '@studio/engine/random/shuffle';
import { EMPTY, ONE, ZERO, encodeDescription } from '../description';
import { UnrulyParams } from '../params';
import { DIFF_ALL, Grid, checkCounts, countsOf, hasThreeInARow, solve } from '../solver/solver';

function blankGrid(w: number, h: number): Grid {
  return { w, h, cells: new Int8Array(w * h) };
}

function copyGrid(grid: Grid): Grid {
  return { w: grid.w, h: grid.h, cells: grid.cells.slice() };
}

/** The squares 0 to area - 1 in random order. */
function shuffledSquares(area: number, random: RandomState): number[] {
  const squares = Array.from({ length: area }, (_, i) => i);
  shuffle(squares, random);
  return squares;
}

/**
 * Tries to fill a grid with a valid solution: picks the empty squares in
 * random order and gives each a random colour, letting the solver fill in
 * whatever that forces. Returns false if the result breaks a rule (the
 * caller then tries again).
 */
function fillGrid(grid: Grid, random: RandomState): boolean {
  const { w } = grid;
  const counts = countsOf(grid);
  for (const i of shuffledSquares(grid.cells.length, random)) {
    if (grid.cells[i] !== EMPTY) continue;
    if (random.upto(2)) {
      grid.cells[i] = ONE;
      counts.onesRows[Math.floor(i / w)]++;
      counts.onesCols[i % w]++;
    } else {
      grid.cells[i] = ZERO;
      counts.zerosRows[Math.floor(i / w)]++;
      counts.zerosCols[i % w]++;
    }
    solve(grid, counts, DIFF_ALL);
  }
  return !hasThreeInARow(grid) && checkCounts(grid, counts) === 0;
}

/** True if the solver, with techniques up to `diff`, fills the whole grid. */
function solvable(grid: Grid, diff: number): boolean {
  const work = copyGrid(grid);
  const counts = countsOf(work);
  solve(work, counts, diff);
  return checkCounts(work, counts) === 0;
}

/**
 * Generates a puzzle exactly as the original does: fill a grid with a
 * random solution, then empty its squares one by one in random order,
 * keeping each one given only if the puzzle can't be solved at the chosen
 * difficulty without it. If the result can also be solved at the level
 * below, start again.
 */
export function generateUnruly(params: UnrulyParams, random: RandomState): GeneratedPuzzle {
  const { w, h, difficulty } = params;
  for (;;) {
    let grid: Grid;
    do grid = blankGrid(w, h);
    while (!fillGrid(grid, random));
    const solution = grid.cells.slice();

    for (const i of shuffledSquares(w * h, random)) {
      const given = grid.cells[i];
      grid.cells[i] = EMPTY;
      if (!solvable(grid, difficulty)) grid.cells[i] = given;
    }

    // The original keeps the puzzle unless the level below could solve it
    // too (checking that no square is left empty and none is overfilled).
    if (difficulty > 0) {
      const work = copyGrid(grid);
      const counts = countsOf(work);
      solve(work, counts, difficulty - 1);
      if (!(checkCounts(work, counts) > 0)) continue;
    }
    return {
      description: encodeDescription(grid.cells),
      solution: Array.from(solution, (c) => (c === ONE ? '1' : '0')).join(''),
    };
  }
}
