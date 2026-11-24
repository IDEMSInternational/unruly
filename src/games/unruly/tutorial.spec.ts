import { TutorialRun } from '@studio/engine/tutorial';
import { ONE, ZERO } from './description';
import { solvePuzzle } from './solution';
import { unrulyTutorial as tutorial } from './tutorial';
import { unrulyGame as game } from './unruly-game';

describe('Unruly tutorial', () => {
  it('uses a puzzle with exactly one solution, found without guessing', () => {
    const initial = game.newGame(tutorial.params, tutorial.description);
    const solve = game.solve(initial);
    expect(solve?.kind).toBe('solve');
    expect(game.applyMove(initial, solve!)!.completed).toBe(true);
  });

  it('can be played through from start to finish', () => {
    const run = new TutorialRun(game, tutorial);
    const set = (x: number, y: number, value: number) =>
      run.move({ kind: 'set', at: { x, y }, value });

    // 1: the square between two whites is black. Other moves are ignored.
    expect(run.hint).toEqual({ square: { x: 3, y: 0 } });
    expect(set(1, 0, ONE)).toBe('refused');
    expect(set(3, 0, ONE)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 2: black beside two blacks...
    expect(run.hint).toEqual({ square: { x: 2, y: 4 } });
    expect(set(2, 4, ONE)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 3: ...is three in a row, so the next tap makes it white.
    expect(run.hint?.note).toBe('Three in a row');
    expect(set(2, 4, 0)).toBe('refused'); // emptying it isn't the lesson
    expect(set(2, 4, ZERO)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 4: the rest of a row with all its blacks is white, one square at a time.
    expect(run.hint).toEqual({ square: { x: 1, y: 1 } });
    expect(set(0, 2, ONE)).toBe('refused');
    expect(set(1, 1, ONE)).toBe('applied');
    expect(set(1, 1, ZERO)).toBe('applied');
    expect(run.hint).toEqual({ square: { x: 3, y: 1 } });
    expect(set(3, 1, ONE)).toBe('applied');
    expect(set(3, 1, ZERO)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 5: finish freely.
    expect(run.hint).toBeUndefined();
    const solution = solvePuzzle(run.state, run.state.givens)!;
    let result = '';
    for (let i = 0; i < 36; i++) {
      if (run.state.cells[i] !== 0) continue;
      result = set(i % 6, Math.floor(i / 6), solution[i] === '1' ? ONE : ZERO);
    }
    expect(result).toBe('step-done');
    expect(run.next()).toBe(false);
  });
});
