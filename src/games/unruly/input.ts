import { Point, squareAt } from '@studio/engine/geometry';
import { EMPTY, ONE, ZERO } from './description';
import { UnrulyMove } from './moves';
import { UnrulyState } from './state';

/** What a tap turns each square into: empty → black → white → empty, as in the original. */
export function nextValue(value: number): number {
  return value === EMPTY ? ONE : value === ONE ? ZERO : EMPTY;
}

/**
 * One touch on the board: a tap on a square, which acts on the square where
 * it starts. If the finger slides off that square, the touch does nothing
 * (there are no drags). Positions are in squares.
 *
 * In thinking mode, new colours are tentative (drawn smaller), and sure
 * ones are protected: they can't be tapped, so discarding a hypothesis
 * never loses work the player was sure of.
 */
export class UnrulyTouch {
  private readonly state: UnrulyState;
  private readonly thinking: boolean;
  /** The square the touch acts on. */
  readonly square: Point;
  /** True once the finger has left the square. */
  private left = false;

  constructor(state: UnrulyState, start: Point, { thinking = false } = {}) {
    this.state = state;
    this.thinking = thinking;
    this.square = squareAt(state, start.x, start.y);
  }

  /** Follows the finger. */
  moveTo(p: Point): void {
    const now = squareAt(this.state, p.x, p.y);
    if (now.x !== this.square.x || now.y !== this.square.y) this.left = true;
  }

  /** The move this touch makes when released, or null if it does nothing. */
  finish(): UnrulyMove | null {
    if (this.left) return null;
    const at = this.square;
    const i = at.y * this.state.w + at.x;
    if (this.state.givens[i] !== EMPTY) return null;
    const value = this.state.cells[i];
    const sure = value !== EMPTY && !this.state.tentative[i];
    if (this.thinking && sure) return null; // protected while thinking
    return {
      kind: 'set',
      at,
      value: nextValue(value),
      ...(this.thinking ? { tentative: true } : {}),
    };
  }
}
