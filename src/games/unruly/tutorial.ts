import { Point } from '@studio/engine/geometry';
import { Tutorial } from '@studio/engine/tutorial';
import { ONE, ZERO } from './description';
import { UnrulyMove } from './moves';
import { EASY, UnrulyParams } from './params';
import { UnrulyState } from './state';

/** Guidance on the board: a square to tap, with an optional note. */
export interface UnrulyHint {
  square: Point;
  note?: string;
}

/**
 * The tutorial puzzle (1 black, 0 white, · empty). Most squares are given,
 * so that a first-time player isn't left with a hard puzzle: after the
 * guided steps only six squares are left, and each follows straight from
 * an idea just taught (a full row or column, or between two of a colour),
 * with no chains of reasoning.
 *
 *     · 1 0 · 0 0      step 1: the square between the two whites is black
 *     0 · 1 · 1 1      step 4: three blacks already, so the rest are white
 *     1 0 1 · · 0
 *     0 1 0 0 1 ·
 *     1 1 · · 1 0      steps 2 and 3: black here makes three in a row
 *     0 0 1 1 0 ·
 */
const DESCRIPTION = 'BabaaBBAAaAcaAaaABACaaaAAab';

/** Between two whites: black. */
const BETWEEN: Point = { x: 3, y: 0 };
/** Beside two blacks: tried black first (three in a row), then white. */
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
 * Teaches by doing, one action per step: a square forced black between two
 * whites, a black that makes three in a row and must turn white, a row
 * that has all its blacks, then finishing the puzzle alone.
 */
export const unrulyTutorial: Tutorial<UnrulyParams, UnrulyState, UnrulyMove, UnrulyHint> = {
  params: { w: 6, h: 6, difficulty: EASY },
  description: DESCRIPTION,
  steps: [
    {
      text:
        'Make every square black or white. No three side by side, across or down, may be the ' +
        'same colour, and each row and column is half black, half white. This square sits ' +
        'between two whites, so it’s black: tap it.',
      hint: { square: BETWEEN },
      expect: (move) => sets(move, BETWEEN, ONE),
      done: (state) => valueAt(state, BETWEEN) === ONE,
    },
    {
      text: 'Now tap here to make this square black too.',
      hint: { square: BESIDE_PAIR },
      expect: (move) => sets(move, BESIDE_PAIR, ONE),
      done: (state) => valueAt(state, BESIDE_PAIR) === ONE,
    },
    {
      text:
        'That makes three blacks side by side, which isn’t allowed. Tap it again to make it ' +
        'white. A third tap would empty it.',
      hint: { square: BESIDE_PAIR, note: 'Three in a row' },
      expect: (move) => sets(move, BESIDE_PAIR, ZERO),
      done: (state) => valueAt(state, BESIDE_PAIR) === ZERO,
    },
    {
      text:
        'This row already has three blacks, half of its six squares, so the others are white. ' +
        'Tap each one twice.',
      hint: (state) => {
        const next = REST_OF_ROW.find((p) => valueAt(state, p) !== ZERO);
        return next && { square: next };
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
