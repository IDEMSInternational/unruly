import { Size } from '@studio/engine/geometry';
import { ONE } from './description';
import { DIFF_ALL, Grid, checkCounts, countsOf, hasThreeInARow, solve } from './solver/solver';

/**
 * Solves a puzzle as the original's Solve does (every technique allowed);
 * returns the solution, "1" (black) or "0" (white) per square, or null if
 * the solver can't finish it or it breaks a rule.
 */
export function solvePuzzle(size: Size, givens: Int8Array): string | null {
  const grid: Grid = { w: size.w, h: size.h, cells: givens.slice() };
  const counts = countsOf(grid);
  solve(grid, counts, DIFF_ALL);
  if (checkCounts(grid, counts) !== 0 || hasThreeInARow(grid)) return null;
  return Array.from(grid.cells, (c) => (c === ONE ? '1' : '0')).join('');
}
