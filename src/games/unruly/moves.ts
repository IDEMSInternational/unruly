import { Point } from '@studio/engine/geometry';
import { EMPTY, ONE, ZERO } from './description';
import { UnrulyState, isSolved } from './state';

export type UnrulyMove =
  /**
   * Colour a square (ONE black, ZERO white) or empty it (EMPTY); the
   * colour is drawn smaller if `tentative` (thinking mode).
   */
  | { kind: 'set'; at: Point; value: number; tentative?: boolean }
  /** Thinking mode: make every tentative square sure (the hypothesis held). */
  | { kind: 'keep-thoughts' }
  /** Thinking mode: empty every tentative square (the hypothesis failed). */
  | { kind: 'discard-thoughts' }
  /** Replace everything with the solution, "1" (black) or "0" (white) per square (marks the game as cheated). */
  | { kind: 'solve'; solution: string };

/** Applies a move, returning a new state, or null if the move is invalid or changes nothing. */
export function applyMove(state: UnrulyState, move: UnrulyMove): UnrulyState | null {
  const { w, h, givens } = state;
  const cells = state.cells.slice();
  const tentative = state.tentative.slice();

  switch (move.kind) {
    case 'set': {
      const { x, y } = move.at;
      if (!(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w && y < h)) {
        return null;
      }
      const i = y * w + x;
      const value = move.value;
      if (givens[i] !== EMPTY || !(value === EMPTY || value === ONE || value === ZERO)) return null;
      const mark = value !== EMPTY && move.tentative ? 1 : 0;
      if (cells[i] === value && tentative[i] === mark) return null;
      cells[i] = value;
      tentative[i] = mark;
      break;
    }
    case 'keep-thoughts':
      if (!tentative.includes(1)) return null;
      tentative.fill(0);
      break;
    case 'discard-thoughts':
      if (!tentative.includes(1)) return null;
      tentative.forEach((t, i) => t && (cells[i] = EMPTY));
      tentative.fill(0);
      break;
    case 'solve': {
      if (move.solution.length !== w * h || !/^[01]*$/.test(move.solution)) return null;
      for (let i = 0; i < w * h; i++) cells[i] = move.solution[i] === '1' ? ONE : ZERO;
      tentative.fill(0);
      break;
    }
  }

  const next = { ...state, cells, tentative };
  return {
    ...next,
    completed: state.completed || isSolved(next),
    cheated: state.cheated || move.kind === 'solve',
  };
}
