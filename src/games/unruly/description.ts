/**
 * Text form of a puzzle, compatible with the original collection. It lists
 * the given squares in reading order: each letter skips some empty squares
 * and then gives one square, lower case for a 0 (white) and upper case for
 * a 1 (black). "a"/"A" skip none, "b"/"B" skip one, ... "y"/"Y" skip 24,
 * and "z"/"Z" skip 25 without giving a square. The text ends with one more
 * letter, for a square just past the end of the grid.
 * Example: "CAd..." = 2 empty squares, a 1, a 1, 3 empty squares, a 0, ...
 *
 * In the decoded form each square is EMPTY, ONE or ZERO.
 */

/** Square values, numbered as in the original. */
export const EMPTY = 0;
export const ONE = 1;
export const ZERO = 2;

export function encodeDescription(squares: ArrayLike<number>): string {
  let text = '';
  let run = 0;
  for (let i = 0; i <= squares.length; i++) {
    const square = i === squares.length ? ZERO : squares[i];
    if (square === EMPTY) {
      run++;
      continue;
    }
    const base = square === ONE ? 65 : 97; // 'A' or 'a'
    for (; run > 24; run -= 25) text += String.fromCharCode(base + 25);
    text += String.fromCharCode(base + run);
    run = 0;
  }
  return text;
}

/** Returns an error message, or null if `text` describes a grid of `area` squares. */
export function validateDescription(area: number, text: string): string | null {
  let pos = 0;
  for (const c of text) {
    if ((c >= 'a' && c < 'z') || (c >= 'A' && c < 'Z'))
      pos += 1 + (c.toLowerCase().charCodeAt(0) - 97);
    else if (c === 'z' || c === 'Z') pos += 25;
    else return 'Description contains invalid characters';
  }
  if (pos < area + 1) return 'Description too short';
  if (pos > area + 1) return 'Description too long';
  return null;
}

/** Decodes a valid description into its squares. */
export function decodeDescription(area: number, text: string): Int8Array {
  const error = validateDescription(area, text);
  if (error) throw new Error(error);
  const squares = new Int8Array(area);
  let pos = 0;
  for (const c of text) {
    if (c === 'z' || c === 'Z') {
      pos += 25;
      continue;
    }
    pos += c.toLowerCase().charCodeAt(0) - 97;
    if (pos < area) squares[pos] = c >= 'a' ? ZERO : ONE;
    pos++;
  }
  return squares;
}
