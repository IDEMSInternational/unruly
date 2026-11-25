import { Point } from '@studio/engine/geometry';
import { Tutorial } from '@studio/engine/tutorial';
import { EMPTY, ONE, ZERO } from './description';
import { UnrulyMove } from './moves';
import { EASY, UnrulyParams } from './params';
import { UnrulyState } from './state';

/** Guidance on the board: a square to tap or swipe on, with an optional note. */
export interface UnrulyHint {
  square: Point;
  gesture: 'tap' | 'up' | 'down';
  note?: string;
  /**
   * A colour to pick under the board first, if it isn't picked yet: the
   * board then points at it in the palette, and at the square once it is.
   */
  pick?: number;
}

/**
 * The tutorial puzzle (1 black, 0 white, · empty). Most squares are given,
 * so that a first-time player isn't left with a hard puzzle: after the
 * guided steps only six squares are left, and each follows straight from
 * an idea just taught (a pair, a full row or column, or between two of a
 * colour), with no chains of reasoning.
 *
 *     1 · 0 · 0 ·      step 1: tap between the two whites (black)
 *     0 · 1 · 1 1      step 7: three blacks already, so the rest are white
 *     1 · 1 1 0 0      step 2: swipe down between the two blacks (white)
 *     0 · 0 0 1 1      step 3: swipe up between the two whites (black)
 *     1 1 · · 1 0      steps 4 to 6: black beside the two blacks makes
 *     0 · · 1 · 1      three in a row: clear it, then make it white
 */
const DESCRIPTION = 'AbbbBBAABAaaabaAAAACaaCBa';

/** Between two whites: black, with a tap. */
const TAP_BLACK: Point = { x: 3, y: 0 };
/** Between two blacks: white, with a swipe down. */
const SWIPE_WHITE: Point = { x: 1, y: 2 };
/** Between two whites: black, with a swipe up. */
const SWIPE_BLACK: Point = { x: 1, y: 3 };
/** Beside two blacks: tried black first (three in a row), cleared, then white. */
const BESIDE_PAIR: Point = { x: 2, y: 4 };
/** The rest of a row that has all its blacks: white, one at a time. */
const REST_OF_ROW: Point[] = [
  { x: 1, y: 1 },
  { x: 3, y: 1 },
];

const valueAt = (state: UnrulyState, p: Point) => state.cells[p.y * state.w + p.x];
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const sets = (move: UnrulyMove, at: Point, value?: number) =>
  move.kind === 'set' && same(move.at, at) && (value === undefined || move.value === value);

/**
 * Teaches by doing, one action per step: tapping with black picked, swiping
 * down for white and up for black, a black that makes three in a row and is
 * tapped away, picking white to tap a square white, a row that has all its
 * blacks, then finishing the puzzle alone.
 */
export const unrulyTutorial: Tutorial<UnrulyParams, UnrulyState, UnrulyMove, UnrulyHint> = {
  params: { w: 6, h: 6, difficulty: EASY },
  description: DESCRIPTION,
  steps: [
    {
      text:
        'Make every square black or white. No three side by side, across or down, may be the ' +
        'same colour, and each row and column is half black, half white. Black is picked below ' +
        'the board, and this square sits between two whites: tap it to make it black.',
      hint: { square: TAP_BLACK, gesture: 'tap' },
      expect: (move) => sets(move, TAP_BLACK, ONE),
      done: (state) => valueAt(state, TAP_BLACK) === ONE,
    },
    {
      text: 'You can also swipe: down for white, up for black. This square sits between two blacks: swipe down on it.',
      hint: { square: SWIPE_WHITE, gesture: 'down' },
      expect: (move) => sets(move, SWIPE_WHITE, ZERO),
      done: (state) => valueAt(state, SWIPE_WHITE) === ZERO,
    },
    {
      text: 'This one sits between two whites: swipe up on it to make it black.',
      hint: { square: SWIPE_BLACK, gesture: 'up' },
      expect: (move) => sets(move, SWIPE_BLACK, ONE),
      done: (state) => valueAt(state, SWIPE_BLACK) === ONE,
    },
    {
      text: 'Now tap here to make this square black too.',
      hint: { square: BESIDE_PAIR, gesture: 'tap' },
      expect: (move) => sets(move, BESIDE_PAIR, ONE),
      done: (state) => valueAt(state, BESIDE_PAIR) === ONE,
    },
    {
      text:
        'That makes three blacks side by side, which isn’t allowed. Tap it again to clear it: ' +
        'tapping a square of the picked colour empties it.',
      hint: { square: BESIDE_PAIR, gesture: 'tap', note: 'Three in a row' },
      expect: (move) => sets(move, BESIDE_PAIR, EMPTY),
      done: (state) => valueAt(state, BESIDE_PAIR) === EMPTY,
    },
    {
      text: 'It has to be white. Pick white below the board, then tap the square.',
      hint: { square: BESIDE_PAIR, gesture: 'tap', pick: ZERO },
      expect: (move) => sets(move, BESIDE_PAIR, ZERO),
      done: (state) => valueAt(state, BESIDE_PAIR) === ZERO,
    },
    {
      text:
        'This row already has three blacks, half of its six squares, so the others are white. ' +
        'Tap or swipe down on each.',
      hint: (state) => {
        const next = REST_OF_ROW.find((p) => valueAt(state, p) !== ZERO);
        return next && { square: next, gesture: 'tap' };
      },
      expect: (move) => REST_OF_ROW.some((p) => sets(move, p)),
      done: (state) => REST_OF_ROW.every((p) => valueAt(state, p) === ZERO),
    },
    {
      text:
        'Now finish the puzzle yourself. Each empty square follows from one of the ideas you’ve ' +
        'just seen.',
      done: (state) => state.completed,
    },
  ],
};
