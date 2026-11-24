import { Size } from '@studio/engine/geometry';
import { EMPTY, ONE, ZERO } from './description';

/** A position in a game of Unruly. Treated as immutable. */
export interface UnrulyState extends Size {
  /** The puzzle's given squares, indexed y * w + x: EMPTY, ONE (black) or ZERO (white). */
  readonly givens: Int8Array;
  /** Every square as it stands: the givens plus the player's squares. */
  readonly cells: Int8Array;
  /**
   * 1 for each square coloured in thinking mode (drawn smaller): part of a
   * hypothesis the player may keep or discard. Tentative squares still
   * count towards the solution.
   */
  readonly tentative: Uint8Array;
  readonly completed: boolean;
  /** True once the player has used "Solve". */
  readonly cheated: boolean;
}

/** Three squares of the same colour in a line: the first one, and the direction. */
export interface Run {
  readonly start: number;
  readonly horizontal: boolean;
}

/** Rule breaks, for "Show mistakes". */
export interface Mistakes {
  /** Every three squares of the same colour next to each other in a row or column. */
  readonly runs: readonly Run[];
  /**
   * Squares of a colour that a row or column has too many of: every such
   * square in that row or column (the original marks each with "!").
   */
  readonly overfull: ReadonlySet<number>;
}

/** Finds rule breaks. Tentative (thinking-mode) squares count like the others. */
export function findMistakes(state: UnrulyState): Mistakes {
  const { w, h, cells } = state;
  const runs: Run[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = cells[y * w + x];
      if (c === EMPTY) continue;
      if (x + 2 < w && cells[y * w + x + 1] === c && cells[y * w + x + 2] === c) {
        runs.push({ start: y * w + x, horizontal: true });
      }
      if (y + 2 < h && cells[(y + 1) * w + x] === c && cells[(y + 2) * w + x] === c) {
        runs.push({ start: y * w + x, horizontal: false });
      }
    }
  }

  const overfull = new Set<number>();
  const check = (line: number[]) => {
    for (const colour of [ONE, ZERO]) {
      const squares = line.filter((i) => cells[i] === colour);
      if (squares.length > line.length / 2) squares.forEach((i) => overfull.add(i));
    }
  };
  for (let y = 0; y < h; y++) check(Array.from({ length: w }, (_, x) => y * w + x));
  for (let x = 0; x < w; x++) check(Array.from({ length: h }, (_, y) => y * w + x));
  return { runs, overfull };
}

/**
 * True when every square is coloured, no three of the same colour are
 * next to each other in a line, and every row and column has as many of
 * each colour.
 */
export function isSolved(state: UnrulyState): boolean {
  if (state.cells.includes(EMPTY)) return false;
  const mistakes = findMistakes(state);
  return mistakes.runs.length === 0 && mistakes.overfull.size === 0;
}
