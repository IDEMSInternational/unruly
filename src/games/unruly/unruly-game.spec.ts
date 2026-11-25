import { RandomState } from '@studio/engine/random/random-state';
import {
  EMPTY,
  ONE,
  ZERO,
  decodeDescription,
  encodeDescription,
  validateDescription,
} from './description';
import { UnrulyTouch } from './input';
import { UnrulyMove, applyMove } from './moves';
import {
  EASY,
  HARD,
  MEDIUM,
  customParams,
  decodeParams,
  encodeParams,
  validateParams,
} from './params';
import { UnrulyState, findMistakes, isSolved } from './state';
import { unrulyTutorial } from './tutorial';
import { unrulyGame } from './unruly-game';

/** A state from rows of "1" (black), "0" (white) and "." (empty), none of them given. */
function stateOf(...rows: string[]): UnrulyState {
  const w = rows[0].length;
  const h = rows.length;
  const cells = Int8Array.from(rows.join(''), (c) => (c === '1' ? ONE : c === '0' ? ZERO : EMPTY));
  return {
    w,
    h,
    givens: new Int8Array(w * h),
    cells,
    tentative: new Uint8Array(w * h),
    completed: false,
    cheated: false,
  };
}

describe('Unruly params', () => {
  it('reads and writes the original game IDs', () => {
    expect(decodeParams('8x8dt')).toEqual({ w: 8, h: 8, difficulty: EASY });
    expect(decodeParams('10x6de')).toEqual({ w: 10, h: 6, difficulty: MEDIUM });
    expect(decodeParams('14dn')).toEqual({ w: 14, h: 14, difficulty: HARD });
    expect(decodeParams('10x10')).toEqual({ w: 10, h: 10, difficulty: EASY }); // the original's default
    expect(encodeParams({ w: 12, h: 8, difficulty: HARD })).toBe('12x8dn');
  });

  it('turns down odd or small sizes, unknown difficulties and unique rows', () => {
    expect(validateParams(decodeParams('8x8dn'))).toBeNull();
    expect(validateParams(decodeParams('7x8dn'))).toMatch(/even/);
    expect(validateParams(decodeParams('4x4dn'))).toMatch(/at least 6/);
    expect(validateParams(decodeParams('8x8dx'))).toMatch(/difficulty/);
    expect(validateParams(decodeParams('8x8d'))).toMatch(/difficulty/);
    expect(validateParams(decodeParams('8x8udn'))).toMatch(/Unique/);
  });

  it('turns down an odd custom size, with a message for the player', () => {
    expect(customParams({ w: 10, h: 12 })).toEqual({ w: 10, h: 12, difficulty: EASY });
    expect(validateParams(customParams({ w: 10, h: 12 }))).toBeNull();
    expect(validateParams(customParams({ w: 9, h: 12 }))).toBe(
      'Width and height must both be even',
    );
  });
});

describe('Unruly descriptions', () => {
  it('round-trips, including skips of 25 or more', () => {
    const squares = new Int8Array(64);
    squares[0] = ONE;
    squares[30] = ZERO;
    squares[63] = ONE;
    const text = encodeDescription(squares);
    expect(text).toBe('AzeZHa');
    expect(validateDescription(64, text)).toBeNull();
    expect(decodeDescription(64, text)).toEqual(squares);
  });

  it('rejects the wrong length or characters', () => {
    expect(validateDescription(64, 'Aze')).toMatch(/short/);
    expect(validateDescription(64, 'AzeZHab')).toMatch(/long/);
    expect(validateDescription(64, 'A1')).toMatch(/invalid/);
  });
});

describe('Unruly rules', () => {
  it('finds three in a row, across and down', () => {
    const { runs, overfull } = findMistakes(stateOf('111.', '0...', '0...', '0...'));
    expect(runs).toEqual([
      { start: 0, horizontal: true },
      { start: 4, horizontal: false },
    ]);
    expect([...overfull].sort((a, b) => a - b)).toEqual([0, 1, 2, 4, 8, 12]);
  });

  it('flags every square of a colour a line has too many of', () => {
    const { runs, overfull } = findMistakes(
      stateOf('11011.', '......', '......', '......', '......', '......'),
    );
    expect(runs).toEqual([]);
    expect([...overfull]).toEqual([0, 1, 3, 4]);
  });

  it('is solved only when full, balanced and with no three in a row', () => {
    expect(isSolved(stateOf('1010', '0101', '1010', '0101'))).toBe(true);
    expect(isSolved(stateOf('1010', '0101', '1010', '010.'))).toBe(false);
    expect(isSolved(stateOf('1100', '0011', '1100', '0011'))).toBe(true);
    expect(isSolved(stateOf('1100', '1100', '0011', '0011'))).toBe(true);
    expect(isSolved(stateOf('1100', '1100', '1100', '0011'))).toBe(false);
  });
});

describe('Unruly moves', () => {
  const params = decodeParams('8x8dt');
  const puzzle = unrulyGame.generate(params, new RandomState('42'));
  const start = unrulyGame.newGame(params, puzzle.description);
  const given = start.givens.findIndex((c) => c !== EMPTY);
  const free = start.givens.findIndex((c) => c === EMPTY);
  const at = (i: number) => ({ x: i % 8, y: Math.floor(i / 8) });

  it('colours and empties squares, but never a given one', () => {
    const black = applyMove(start, { kind: 'set', at: at(free), value: ONE })!;
    expect(black.cells[free]).toBe(ONE);
    expect(applyMove(black, { kind: 'set', at: at(free), value: ONE })).toBeNull(); // no change
    expect(applyMove(black, { kind: 'set', at: at(free), value: EMPTY })!.cells[free]).toBe(EMPTY);
    expect(applyMove(start, { kind: 'set', at: at(given), value: EMPTY })).toBeNull();
    expect(applyMove(start, { kind: 'set', at: { x: 8, y: 0 }, value: ONE })).toBeNull();
  });

  it('keeps or discards thinking-mode squares', () => {
    const thought = applyMove(start, { kind: 'set', at: at(free), value: ZERO, tentative: true })!;
    expect(thought.tentative[free]).toBe(1);
    const kept = applyMove(thought, { kind: 'keep-thoughts' })!;
    expect([kept.cells[free], kept.tentative[free]]).toEqual([ZERO, 0]);
    const discarded = applyMove(thought, { kind: 'discard-thoughts' })!;
    expect([discarded.cells[free], discarded.tentative[free]]).toEqual([EMPTY, 0]);
    expect(applyMove(start, { kind: 'keep-thoughts' })).toBeNull();
  });

  it('is completed by the solution, and Solve marks the game as cheated', () => {
    let played: UnrulyState = start;
    for (let i = 0; i < 64; i++) {
      if (start.givens[i] !== EMPTY) continue;
      const value = puzzle.solution![i] === '1' ? ONE : ZERO;
      expect(played.completed).toBe(false);
      played = applyMove(played, { kind: 'set', at: at(i), value })!;
    }
    expect(played.completed).toBe(true);
    expect(played.cheated).toBe(false);

    const solved = applyMove(start, unrulyGame.solve(start)!)!;
    expect([solved.completed, solved.cheated]).toEqual([true, true]);
    expect(unrulyGame.solve(start)).toEqual({ kind: 'solve', solution: puzzle.solution });
  });
});

/** The tutorial puzzle, for the tap and swipe tests: (1, 0) is empty, (0, 0) a given black. */
const tutorialStart = unrulyGame.newGame(unrulyTutorial.params, unrulyTutorial.description);

/** A touch on square (x, y) that moves by (dx, dy) squares, with this colour picked. */
function touch(
  state: UnrulyState,
  x: number,
  y: number,
  { dx = 0, dy = 0, picked = ONE, thinking = false } = {},
) {
  const t = new UnrulyTouch(state, { x: x + 0.5, y: y + 0.5 }, { picked, thinking });
  t.moveTo({ x: x + 0.5 + dx, y: y + 0.5 + dy });
  return t;
}
const tap = (state: UnrulyState, picked = ONE, thinking = false) =>
  touch(state, 1, 0, { dx: 0.05, dy: -0.05, picked, thinking }).finish(); // a little finger jitter
const swipe = (state: UnrulyState, dy: number, dx = 0) => touch(state, 1, 0, { dx, dy }).finish();
const play = (state: UnrulyState, move: UnrulyMove | null) => applyMove(state, move!)!;

describe('Unruly taps and swipes', () => {
  it('tap: the picked colour, a change to it, or emptied if it already has it', () => {
    const black = play(tutorialStart, tap(tutorialStart));
    expect(black.cells[1]).toBe(ONE);
    const white = play(black, tap(black, ZERO)); // white picked: changes it
    expect(white.cells[1]).toBe(ZERO);
    expect(play(white, tap(white, ZERO)).cells[1]).toBe(EMPTY); // white again: emptied
  });

  it('swipe: up for black, down for white, whatever is picked', () => {
    const black = play(tutorialStart, swipe(tutorialStart, -0.4));
    expect(black.cells[1]).toBe(ONE);
    const white = play(black, swipe(black, 0.4));
    expect(white.cells[1]).toBe(ZERO);
    expect(swipe(white, 0.4)).toBeNull(); // already white: nothing
  });

  it('ignores sideways swipes, and cancels a swipe that comes back near the start', () => {
    expect(swipe(tutorialStart, 0.1, 0.4)).toBeNull();
    const t = touch(tutorialStart, 1, 0, { dy: 0.4 });
    expect(t.swipeColour).toBe(ZERO);
    t.moveTo({ x: 1.55, y: 0.55 });
    expect([t.isSwipe, t.swipeColour, t.finish()]).toEqual([true, null, null]);
  });

  it('leaves given squares alone, and touches that start off the grid', () => {
    expect(touch(tutorialStart, 0, 0).finish()).toBeNull(); // a given black
    expect(new UnrulyTouch(tutorialStart, { x: 1.5, y: 6.3 }).finish()).toBeNull();
  });

  it('in thinking mode, makes tentative squares and leaves sure ones alone', () => {
    const thought = play(tutorialStart, tap(tutorialStart, ONE, true));
    expect([thought.cells[1], thought.tentative[1]]).toEqual([ONE, 1]);
    expect(tap(thought, ZERO, true)).toEqual({
      kind: 'set',
      at: { x: 1, y: 0 },
      value: ZERO,
      tentative: true,
    });

    const sure = play(tutorialStart, tap(tutorialStart));
    expect(tap(sure, ZERO, true)).toBeNull();
  });
});
