/**
 * The original's solver (unruly.c), deductions only, no guessing. It works
 * on a grid of EMPTY, ONE and ZERO squares, filling in every square it can
 * deduce, and keeps count of each colour in every row and column as it
 * goes. The order in which it looks at squares matters (it fills squares
 * as it scans), so it follows the original's loops exactly: the generator
 * must make the same puzzles as the original from the same seed.
 */
import { EMPTY, ONE, ZERO } from '../description';

/** A placeholder the solver puts in squares for a moment (never left in the grid). */
const BOGUS = 3;

/** The original's difficulty levels for the solver: the app's Easy, Medium and Hard. */
export const DIFF_TRIVIAL = 0;
export const DIFF_EASY = 1;
export const DIFF_NORMAL = 2;
/** Every technique. */
export const DIFF_ALL = 3;

/** A working grid: each square EMPTY, ONE or ZERO, indexed y * w + x. */
export interface Grid {
  readonly w: number;
  readonly h: number;
  readonly cells: Int8Array;
}

/** How many ones and zeros are in each row and column. */
export interface Counts {
  readonly onesRows: Int32Array;
  readonly onesCols: Int32Array;
  readonly zerosRows: Int32Array;
  readonly zerosCols: Int32Array;
}

export function countsOf(grid: Grid): Counts {
  const { w, h, cells } = grid;
  const counts = {
    onesRows: new Int32Array(h),
    onesCols: new Int32Array(w),
    zerosRows: new Int32Array(h),
    zerosCols: new Int32Array(w),
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (cells[y * w + x] === ONE) {
        counts.onesRows[y]++;
        counts.onesCols[x]++;
      } else if (cells[y * w + x] === ZERO) {
        counts.zerosRows[y]++;
        counts.zerosCols[x]++;
      }
    }
  }
  return counts;
}

/**
 * Two of `check` next to each other, or with a gap between them: the
 * square that would make three must be `block`.
 */
function checkThrees(
  grid: Grid,
  rowCount: Int32Array,
  colCount: Int32Array,
  horizontal: boolean,
  check: number,
  block: number,
): number {
  const { w, h, cells } = grid;
  const dx = horizontal ? 1 : 0;
  const dy = 1 - dx;
  let done = 0;
  const set = (i: number) => {
    done++;
    cells[i] = block;
    rowCount[Math.floor(i / w)]++;
    colCount[i % w]++;
  };

  for (let y = dy; y < h - dy; y++) {
    for (let x = dx; x < w - dx; x++) {
      const i1 = (y - dy) * w + (x - dx);
      const i2 = y * w + x;
      const i3 = (y + dy) * w + (x + dx);
      if (cells[i1] === check && cells[i2] === check && cells[i3] === EMPTY) set(i3);
      if (cells[i1] === check && cells[i2] === EMPTY && cells[i3] === check) set(i2);
      if (cells[i1] === EMPTY && cells[i2] === check && cells[i3] === check) set(i1);
    }
  }
  return done;
}

function checkAllThrees(grid: Grid, c: Counts): number {
  return (
    checkThrees(grid, c.zerosRows, c.zerosCols, true, ONE, ZERO) +
    checkThrees(grid, c.onesRows, c.onesCols, true, ZERO, ONE) +
    checkThrees(grid, c.zerosRows, c.zerosCols, false, ONE, ZERO) +
    checkThrees(grid, c.onesRows, c.onesCols, false, ZERO, ONE)
  );
}

/** Puts `fill` in every empty square of row (or column) i. */
function fillRow(
  grid: Grid,
  i: number,
  horizontal: boolean,
  rowCount: Int32Array,
  colCount: Int32Array,
  fill: number,
): number {
  const { w, h, cells } = grid;
  let done = 0;
  for (let j = 0; j < (horizontal ? w : h); j++) {
    const p = horizontal ? i * w + j : j * w + i;
    if (cells[p] === EMPTY) {
      done++;
      cells[p] = fill;
      rowCount[horizontal ? i : j]++;
      colCount[horizontal ? j : i]++;
    }
  }
  return done;
}

/**
 * Lines that have all of one colour and one square left (`orMore` false),
 * or all of one colour and any number of squares left (`orMore` true): the
 * rest are `fill`, the other colour.
 */
function checkComplete(
  grid: Grid,
  complete: Int32Array,
  horizontal: boolean,
  rowCount: Int32Array,
  colCount: Int32Array,
  fill: number,
  orMore: boolean,
): number {
  const { w, h } = grid;
  const count = horizontal ? h : w;
  const target = (horizontal ? w : h) / 2;
  const other = horizontal ? rowCount : colCount;
  let done = 0;
  for (let i = 0; i < count; i++) {
    if (complete[i] === target && (orMore ? other[i] < target : other[i] === target - 1)) {
      done += fillRow(grid, i, horizontal, rowCount, colCount, fill);
    }
  }
  return done;
}

function checkAllComplete(grid: Grid, c: Counts, orMore: boolean): number {
  return (
    checkComplete(grid, c.onesRows, true, c.zerosRows, c.zerosCols, ZERO, orMore) +
    checkComplete(grid, c.onesCols, false, c.zerosRows, c.zerosCols, ZERO, orMore) +
    checkComplete(grid, c.zerosRows, true, c.onesRows, c.onesCols, ONE, orMore) +
    checkComplete(grid, c.zerosCols, false, c.onesRows, c.onesCols, ONE, orMore)
  );
}

/**
 * A line that needs one more of a colour (Y) and at least two more of the
 * other (X): if three squares next to each other could only take X apart
 * from the one Y, the Y must be among them, so every other empty square in
 * the line is X. For example, in "1 1 0 . . ." the last 1 can't go in the
 * last square (that would make "0 0 0"), so it is among the two squares
 * before it, and the last square is 0.
 */
function checkNearComplete(
  grid: Grid,
  complete: Int32Array,
  horizontal: boolean,
  rowCount: Int32Array,
  colCount: Int32Array,
  fill: number,
): number {
  const { w: w2, h: h2, cells } = grid;
  const w = w2 / 2;
  const h = h2 / 2;
  const dx = horizontal ? 1 : 0;
  const dy = 1 - dx;
  let done = 0;
  /** Fills the line with the given squares held out for a moment. */
  const fillAround = (i: number, held: number[]) => {
    for (const p of held) cells[p] = BOGUS;
    done += fillRow(grid, i, horizontal, rowCount, colCount, fill);
    for (const p of held) cells[p] = EMPTY;
  };

  for (let y = dy; y < h2 - dy; y++) {
    if (horizontal && (complete[y] < w - 1 || rowCount[y] > w - 2)) continue;
    for (let x = dx; x < w2 - dx; x++) {
      if (!horizontal && (complete[x] < h - 1 || colCount[x] > h - 2)) continue;
      const i = horizontal ? y : x;
      const i1 = (y - dy) * w2 + (x - dx);
      const i2 = y * w2 + x;
      const i3 = (y + dy) * w2 + (x + dx);
      if (cells[i1] === fill && cells[i2] === EMPTY && cells[i3] === EMPTY) fillAround(i, [i2, i3]);
      else if (cells[i1] === EMPTY && cells[i2] === fill && cells[i3] === EMPTY)
        fillAround(i, [i1, i3]);
      else if (cells[i1] === EMPTY && cells[i2] === EMPTY && cells[i3] === fill)
        fillAround(i, [i1, i2]);
      else if (cells[i1] === EMPTY && cells[i2] === EMPTY && cells[i3] === EMPTY)
        fillAround(i, [i1, i2, i3]);
    }
  }
  return done;
}

function checkAllNearComplete(grid: Grid, c: Counts): number {
  return (
    checkNearComplete(grid, c.onesRows, true, c.zerosRows, c.zerosCols, ZERO) +
    checkNearComplete(grid, c.onesCols, false, c.zerosRows, c.zerosCols, ZERO) +
    checkNearComplete(grid, c.zerosRows, true, c.onesRows, c.onesCols, ONE) +
    checkNearComplete(grid, c.zerosCols, false, c.onesRows, c.onesCols, ONE)
  );
}

/**
 * Fills in every square that the techniques up to `diff` can deduce,
 * keeping `counts` up to date. Returns the hardest level used, or -1 if
 * nothing could be deduced.
 */
export function solve(grid: Grid, counts: Counts, diff: number): number {
  let maxDiff = -1;
  for (;;) {
    if (checkAllThrees(grid, counts)) {
      maxDiff = Math.max(maxDiff, DIFF_TRIVIAL);
      continue;
    }
    if (checkAllComplete(grid, counts, false)) {
      maxDiff = Math.max(maxDiff, DIFF_TRIVIAL);
      continue;
    }
    if (diff < DIFF_EASY) break;
    if (checkAllComplete(grid, counts, true)) {
      maxDiff = Math.max(maxDiff, DIFF_EASY);
      continue;
    }
    if (diff < DIFF_NORMAL) break;
    if (checkAllNearComplete(grid, counts)) {
      maxDiff = Math.max(maxDiff, DIFF_NORMAL);
      continue;
    }
    break;
  }
  return maxDiff;
}

/**
 * Checks the colour counts: -1 if some row or column has too many of a
 * colour, 1 if none has too many but some square is still empty, 0 if
 * every row and column is balanced.
 */
export function checkCounts(grid: Grid, counts: Counts = countsOf(grid)): number {
  const halfW = grid.w / 2;
  const halfH = grid.h / 2;
  let below = false;
  let above = false;
  for (let i = 0; i < grid.w; i++) {
    if (counts.onesCols[i] < halfH || counts.zerosCols[i] < halfH) below = true;
    if (counts.onesCols[i] > halfH || counts.zerosCols[i] > halfH) above = true;
  }
  for (let i = 0; i < grid.h; i++) {
    if (counts.onesRows[i] < halfW || counts.zerosRows[i] < halfW) below = true;
    if (counts.onesRows[i] > halfW || counts.zerosRows[i] > halfW) above = true;
  }
  return above ? -1 : below ? 1 : 0;
}

/** True if three squares of the same colour are next to each other in a row or column. */
export function hasThreeInARow(grid: Grid): boolean {
  const { w, h, cells } = grid;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = cells[y * w + x];
      if (c !== ONE && c !== ZERO) continue;
      if (x + 2 < w && cells[y * w + x + 1] === c && cells[y * w + x + 2] === c) return true;
      if (y + 2 < h && cells[(y + 1) * w + x] === c && cells[(y + 2) * w + x] === c) return true;
    }
  }
  return false;
}
