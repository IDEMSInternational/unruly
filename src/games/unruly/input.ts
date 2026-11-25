import { Point, squareAt } from '@studio/engine/geometry';
import { EMPTY, ONE, ZERO } from './description';
import { UnrulyMove } from './moves';
import { UnrulyState } from './state';

/**
 * How far (in squares) the finger may wander and still tap; further makes a
 * swipe. The board sets it from a distance on screen (about 10 pixels), so
 * it feels the same on every board size.
 */
export const DEFAULT_SLOP = 0.25;

/**
 * One touch on the board, which acts on the square where it starts:
 * - a tap gives the square the colour picked under the board, or empties it
 *   if it already has that colour;
 * - a short swipe up makes it black and a swipe down white, whatever is
 *   picked; on a square already that colour it does nothing. Only mostly
 *   vertical swipes count, and moving back near the start cancels one.
 * Given squares can't be changed. Positions are in squares.
 *
 * In thinking mode, new colours are tentative (drawn smaller), and sure
 * ones are protected: they can't be changed, so discarding a hypothesis
 * never loses work the player was sure of.
 */
export class UnrulyTouch {
  private readonly state: UnrulyState;
  private readonly start: Point;
  private readonly picked: number;
  private readonly slop: number;
  private readonly thinking: boolean;
  /** The square the touch acts on. */
  readonly square: Point;
  /** False for a touch that starts off the grid (e.g. between it and the palette). */
  private readonly onGrid: boolean;
  /** Where the finger is, from where it touched down. */
  private dx = 0;
  private dy = 0;
  /** True once the finger has moved further than the slop: a swipe, not a tap. */
  private moved = false;

  /**
   * `picked`: the colour a tap gives (ONE or ZERO). `slop`: see DEFAULT_SLOP.
   * `thinking`: thinking mode.
   */
  constructor(
    state: UnrulyState,
    start: Point,
    { picked = ONE, slop = DEFAULT_SLOP, thinking = false } = {},
  ) {
    this.state = state;
    this.start = start;
    this.picked = picked;
    this.slop = slop;
    this.thinking = thinking;
    this.square = squareAt(state, start.x, start.y);
    this.onGrid = start.x >= 0 && start.y >= 0 && start.x < state.w && start.y < state.h;
  }

  /** Follows the finger. */
  moveTo(p: Point): void {
    this.dx = p.x - this.start.x;
    this.dy = p.y - this.start.y;
    if (Math.hypot(this.dx, this.dy) > this.slop) this.moved = true;
  }

  /** True once the finger has moved beyond the slop: a swipe, not a tap. */
  get isSwipe(): boolean {
    return this.moved;
  }

  /**
   * The colour the swipe gives as things stand: ONE (up) or ZERO (down), or
   * null if it isn't a swipe, has come back near the start, or is sideways.
   */
  get swipeColour(): number | null {
    if (!this.moved || !this.onGrid) return null;
    if (Math.hypot(this.dx, this.dy) <= this.slop) return null; // back near the start
    if (Math.abs(this.dy) <= Math.abs(this.dx)) return null; // sideways
    return this.dy < 0 ? ONE : ZERO;
  }

  /** The move this touch makes when released, or null if it does nothing. */
  finish(): UnrulyMove | null {
    if (!this.onGrid) return null;
    const at = this.square;
    const i = at.y * this.state.w + at.x;
    if (this.state.givens[i] !== EMPTY) return null;
    const value = this.state.cells[i];
    const sure = value !== EMPTY && !this.state.tentative[i];
    if (this.thinking && sure) return null; // protected while thinking

    let next: number;
    if (this.moved) {
      const colour = this.swipeColour;
      if (colour === null || colour === value) return null;
      next = colour;
    } else {
      next = value === this.picked ? EMPTY : this.picked;
    }
    return { kind: 'set', at, value: next, ...(this.thinking ? { tentative: true } : {}) };
  }
}

/** The colours a player can pick, as the palette under the board shows them. */
export const PICKABLE = [
  { value: ONE, label: 'Black (or swipe up)' },
  { value: ZERO, label: 'White (or swipe down)' },
];
