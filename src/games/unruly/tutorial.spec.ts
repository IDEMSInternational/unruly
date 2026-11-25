import { TutorialRun } from '@studio/engine/tutorial';
import { EMPTY, ONE, ZERO } from './description';
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

    // 1: tap the square between two whites (black is picked). Other moves are ignored.
    expect(run.hint).toEqual({ square: { x: 3, y: 0 }, gesture: 'tap' });
    expect(set(1, 0, ONE)).toBe('refused');
    expect(set(3, 0, ONE)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 2: swipe down between two blacks.
    expect(run.hint).toEqual({ square: { x: 1, y: 2 }, gesture: 'down' });
    expect(set(1, 2, ONE)).toBe('refused');
    expect(set(1, 2, ZERO)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 3: swipe up between two whites.
    expect(run.hint).toEqual({ square: { x: 1, y: 3 }, gesture: 'up' });
    expect(set(1, 3, ONE)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 4: black beside two blacks...
    expect(set(2, 4, ONE)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 5: ...is three in a row: tap it again to clear it.
    expect(run.hint?.note).toBe('Three in a row');
    expect(set(2, 4, ZERO)).toBe('refused');
    expect(set(2, 4, EMPTY)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 6: pick white (the board points at it in the palette), then tap the square.
    expect(run.hint).toEqual({ square: { x: 2, y: 4 }, gesture: 'tap', pick: ZERO });
    expect(set(2, 4, ZERO)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 7: the rest of a row with all its blacks is white, one square at a time.
    expect(run.hint).toEqual({ square: { x: 1, y: 1 }, gesture: 'tap' });
    expect(set(0, 5, ONE)).toBe('refused');
    expect(set(1, 1, ZERO)).toBe('applied');
    expect(run.hint).toEqual({ square: { x: 3, y: 1 }, gesture: 'tap' });
    expect(set(3, 1, ZERO)).toBe('step-done');
    expect(run.next()).toBe(true);

    // 8: finish freely: six squares are left.
    expect(run.hint).toBeUndefined();
    expect(run.state.cells.filter((c) => c === EMPTY).length).toBe(6);
    const solution = solvePuzzle(run.state, run.state.givens)!;
    let result = '';
    for (let i = 0; i < 36; i++) {
      if (run.state.cells[i] !== EMPTY) continue;
      result = set(i % 6, Math.floor(i / 6), solution[i] === '1' ? ONE : ZERO);
    }
    expect(result).toBe('step-done');
    expect(run.next()).toBe(false);
  });
});
