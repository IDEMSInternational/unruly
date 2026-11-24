import { RandomState } from '@studio/engine/random/random-state';
import { decodeDescription } from '../description';
import { decodeParams } from '../params';
import { solvePuzzle } from '../solution';
import reference from '../testing/reference-puzzles.json';
import { generateUnruly } from './generate';

/**
 * The reference puzzles were generated, and solved, by the original C code
 * (see tools/c-reference). The port must reproduce every one exactly.
 */
describe('generateUnruly matches the original C generator', () => {
  for (const ref of reference) {
    it(`${ref.params}#${ref.seed}`, () => {
      const puzzle = generateUnruly(decodeParams(ref.params), new RandomState(ref.seed));
      expect(puzzle.description).toBe(ref.description);
      expect('S' + puzzle.solution).toBe(ref.solution);
    });
  }
});

describe('the solver matches the original C solver', () => {
  for (const ref of reference) {
    it(`${ref.params}#${ref.seed}`, () => {
      const params = decodeParams(ref.params);
      const solution = solvePuzzle(params, decodeDescription(params.w * params.h, ref.description));
      expect('S' + solution).toBe(ref.solution);
    });
  }
});
