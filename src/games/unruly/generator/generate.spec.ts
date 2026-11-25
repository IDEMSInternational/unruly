import { RandomState } from '@studio/engine/random/random-state';
import { referencePuzzlesToCheck } from '@studio/engine/reference-puzzles';
import { decodeDescription } from '../description';
import { decodeParams } from '../params';
import { solvePuzzle } from '../solution';
import reference from '../testing/reference-puzzles.json';
import { generateUnruly } from './generate';

/**
 * The recorded puzzles were generated, and solved, by the original C code
 * (see tools/c-reference). The port must reproduce each one exactly: the
 * puzzle, its solution, and the solver finding that solution from the
 * puzzle alone. `npm test` checks a sample, `npm run test:puzzles` all of them.
 */
describe('Unruly matches the original C code', () => {
  for (const ref of referencePuzzlesToCheck(reference)) {
    it(`${ref.params}#${ref.seed}`, () => {
      const params = decodeParams(ref.params);
      const puzzle = generateUnruly(params, new RandomState(ref.seed));
      expect(puzzle.description).toBe(ref.description);
      expect('S' + puzzle.solution).toBe(ref.solution);
      const solved = solvePuzzle(params, decodeDescription(params.w * params.h, ref.description));
      expect('S' + solved).toBe(ref.solution);
    });
  }
});
