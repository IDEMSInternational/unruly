import { PuzzleGame } from '@studio/engine/puzzle-game';
import { decodeDescription, validateDescription } from './description';
import { generateUnruly } from './generator/generate';
import { UnrulyMove, applyMove } from './moves';
import {
  DIFFICULTIES,
  UnrulyParams,
  customFields,
  customParams,
  daily,
  decodeParams,
  defaultParams,
  encodeParams,
  presets,
  validateParams,
} from './params';
import { solvePuzzle } from './solution';
import { UnrulyState } from './state';

/**
 * Unruly (also known as Takuzu or Binairo): colour every square black or
 * white, with no three of the same colour next to each other in a row or
 * column, and as many of each colour in every row and column.
 */
export const unrulyGame: PuzzleGame<UnrulyParams, UnrulyState, UnrulyMove> = {
  id: 'unruly',
  name: 'Unruly',

  defaultParams,
  presets,
  encodeParams,
  decodeParams,
  validateParams,
  customFields,
  customParams,

  difficulties: DIFFICULTIES,
  difficultyOf: (params) => params.difficulty,
  withDifficulty: (params, difficulty) => ({ ...params, difficulty }),

  generate: generateUnruly,
  validateDescription: (params, description) =>
    validateDescription(params.w * params.h, description),

  newGame(params, description) {
    const givens = decodeDescription(params.w * params.h, description);
    return {
      w: params.w,
      h: params.h,
      givens,
      cells: givens.slice(),
      tentative: new Uint8Array(givens.length),
      completed: false,
      cheated: false,
    };
  },

  applyMove,
  isCompleted: (state) => state.completed,
  canShowMistakes: true,
  daily,

  solve(initial, solution) {
    const answer = solution ?? solvePuzzle(initial, initial.givens);
    return answer ? { kind: 'solve', solution: answer } : null;
  },
};
