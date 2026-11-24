import { EMPTY, ONE, ZERO } from './description';
import { UnrulyTouch } from './input';
import { applyMove } from './moves';
import { UnrulyState } from './state';
import { unrulyTutorial } from './tutorial';
import { unrulyGame } from './unruly-game';

const start = unrulyGame.newGame(unrulyTutorial.params, unrulyTutorial.description);

/** A tap at the middle of square (x, y). */
function tap(state: UnrulyState, x: number, y: number, thinking = false) {
  const touch = new UnrulyTouch(state, { x: x + 0.5, y: y + 0.5 }, { thinking });
  touch.moveTo({ x: x + 0.6, y: y + 0.4 }); // a little finger jitter
  return touch.finish();
}

describe('Unruly taps', () => {
  it('cycle a square: empty, black, white, empty', () => {
    let state = start;
    const values: number[] = [];
    for (let i = 0; i < 3; i++) {
      state = applyMove(state, tap(state, 0, 0)!)!;
      values.push(state.cells[0]);
    }
    expect(values).toEqual([ONE, ZERO, EMPTY]);
  });

  it('leave given squares alone', () => {
    expect(tap(start, 2, 0)).toBeNull(); // a given white
  });

  it('do nothing if the finger slides off the square', () => {
    const touch = new UnrulyTouch(start, { x: 0.5, y: 0.5 });
    touch.moveTo({ x: 1.5, y: 0.5 });
    touch.moveTo({ x: 0.5, y: 0.5 });
    expect(touch.finish()).toBeNull();
  });

  it('in thinking mode, make tentative squares and leave sure ones alone', () => {
    const thought = applyMove(start, tap(start, 0, 0, true)!)!;
    expect([thought.cells[0], thought.tentative[0]]).toEqual([ONE, 1]);
    expect(tap(thought, 0, 0, true)).toEqual({
      kind: 'set',
      at: { x: 0, y: 0 },
      value: ZERO,
      tentative: true,
    });

    const sure = applyMove(start, tap(start, 0, 0)!)!;
    expect(tap(sure, 0, 0, true)).toBeNull();
  });
});
