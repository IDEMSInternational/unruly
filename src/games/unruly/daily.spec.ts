import { dailyPuzzle } from '@studio/engine/daily';
import { GameSession } from '@studio/engine/game-session';
import { unrulyGame } from './unruly-game';

describe('Unruly daily puzzles', () => {
  // A promise to players: everyone gets the same puzzle on the same day,
  // whatever the version. If this fails, the generator, the schedule or
  // the date rule has changed the daily puzzles.
  it.each([
    ['2026-11-30', 0, '6x6dt:AafBiCBaBfAba'], // Monday, Easy
    ['2026-11-30', 1, '6x6de:gcbhEdBabAb'], // Monday, Medium
    ['2026-11-30', 2, '6x6dn:cbahaIECda'], // Monday, Hard
    ['2026-12-03', 1, '8x8de:ceDbdaBCICaCGEebcc'], // Thursday, Medium
    ['2026-12-03', 2, '8x8dn:dbdFbdBfpCiaDb'], // Thursday, Hard
    ['2026-12-06', 0, '10x10dt:BAeCeFdcAECcbCeCJbgFAbeaBAcg'], // Sunday, Easy
    ['2026-12-06', 1, '10x10de:AlabbDOABdbFEscBbabeceaa'], // Sunday, Medium
    ['2026-12-06', 2, '10x10dn:BcffcaCEHBkbNCAACBDiDga'], // Sunday, Hard
  ])('%s at level %i is always %s', (date, level, expected) => {
    const puzzle = dailyPuzzle('unruly', unrulyGame.daily!, date, level)!;
    const session = new GameSession(unrulyGame, puzzle.params, puzzle.seed);
    expect(`${unrulyGame.encodeParams(session.params)}:${session.description}`).toBe(expected);
  });

  it('numbers the puzzles from the first day, Tuesday 24 November 2026', () => {
    expect(dailyPuzzle('unruly', unrulyGame.daily!, '2026-11-24', 0)?.number).toBe(1);
  });
});
