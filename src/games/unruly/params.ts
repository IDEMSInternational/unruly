import { DailySchedule } from '@studio/engine/daily';
import { CustomField, Preset } from '@studio/engine/puzzle-game';

/**
 * Difficulties, as in the original, which calls them Trivial, Easy and
 * Normal. Easy only needs the deductions about three in a row and lines
 * with one square left; Medium also fills a line once it has all of one
 * colour; Hard also rules out a colour where it would force three in a row
 * elsewhere in a line that is nearly done.
 */
export const EASY = 0;
export const MEDIUM = 1;
export const HARD = 2;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** The original's letters for its difficulties in game IDs: Trivial, Easy, Normal. */
const DIFFICULTY_LETTERS = 'ten';

/** Smallest and largest grid sides offered to players (the original's minimum is 6). */
const MIN_SIDE = 6;
const MAX_SIDE = 16;

export interface UnrulyParams {
  /** Width and height: both even. */
  w: number;
  h: number;
  difficulty: number;
}

export function defaultParams(): UnrulyParams {
  return { w: 8, h: 8, difficulty: EASY };
}

export function presets(): Preset<UnrulyParams>[] {
  return [6, 8, 10, 12, 14].map((n) => ({
    name: `${n}×${n}`,
    params: { w: n, h: n, difficulty: EASY },
  }));
}

export function customFields(params: UnrulyParams): CustomField[] {
  return [
    { key: 'w', label: 'Width', min: MIN_SIDE, max: MAX_SIDE, value: params.w },
    { key: 'h', label: 'Height', min: MIN_SIDE, max: MAX_SIDE, value: params.h },
  ];
}

/** Custom settings: an odd side is rounded down to the even size below. */
export function customParams(values: Readonly<Record<string, number>>): UnrulyParams {
  const even = (n: number) => Math.max(MIN_SIDE, n - (n % 2));
  return { w: even(values['w']), h: even(values['h']), difficulty: EASY };
}

/**
 * The daily puzzles' sizes, Monday to Sunday, growing through the week
 * from 6×6 to 10×10. Each level is the difficulty of the same name (Unruly
 * has three, so the levels match them). Beat the clock uses the same
 * sizes. Changing this changes the daily puzzles for everyone (see
 * daily.ts in the engine).
 */
const DAILY_SIZES = [6, 6, 8, 8, 8, 10, 10];

export const daily: DailySchedule<UnrulyParams> = {
  firstDay: '2026-11-24',
  levels: [EASY, MEDIUM, HARD].map((difficulty) =>
    DAILY_SIZES.map((n) => ({ w: n, h: n, difficulty })),
  ),
};

/** Text form, the original's full one: "8x8dt". */
export function encodeParams(params: UnrulyParams): string {
  return `${params.w}x${params.h}d${DIFFICULTY_LETTERS[params.difficulty] ?? '?'}`;
}

/**
 * Reads the text form as the original does, starting from the original's
 * default puzzle (8×8, Trivial), so that a short form such as "10x10"
 * means the same puzzle as there. The original's "u" (unique rows and
 * columns) is read but the app doesn't offer that rule, so validateParams
 * turns it down.
 */
export function decodeParams(text: string): UnrulyParams & { unique?: boolean } {
  const params: UnrulyParams & { unique?: boolean } = defaultParams();
  let rest = text;
  const number = (): number => {
    const match = /^\d*/.exec(rest)![0];
    rest = rest.slice(match.length);
    return parseInt(match, 10) || 0;
  };

  params.w = number();
  params.h = params.w;
  if (rest.startsWith('x')) {
    rest = rest.slice(1);
    params.h = number();
  }
  if (rest.startsWith('u')) {
    rest = rest.slice(1);
    params.unique = true;
  }
  if (rest.startsWith('d')) {
    rest = rest.slice(1);
    const letter = rest[0];
    params.difficulty = letter ? DIFFICULTY_LETTERS.indexOf(letter) : -1;
    if (params.difficulty < 0) params.difficulty = DIFFICULTIES.length + 1; // invalid
  }
  return params;
}

export function validateParams(params: UnrulyParams & { unique?: boolean }): string | null {
  const { w, h } = params;
  if (w % 2 || h % 2) return 'Width and height must both be even';
  if (w < MIN_SIDE || h < MIN_SIDE) return 'Width and height must be at least 6';
  if (w * h > 10000) return 'Width times height must not be unreasonably large';
  if (params.unique) return 'Unique rows and columns are not supported';
  if (!(params.difficulty >= EASY && params.difficulty <= HARD)) return 'Unknown difficulty rating';
  return null;
}
