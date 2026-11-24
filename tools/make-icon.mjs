// Draws Unruly's app icon: a 2×2 corner of a board, black and white
// squares in a checkerboard (each row and column balanced, no three
// alike), with empty squares around it, in the game's own colours.
//
// Usage: node tools/make-icon.mjs   (then: npm run app-images)
import { resolve } from 'node:path';
import { makeAppIcon } from '../games-common-core/tools/make-app-icon.mjs';

// Colours from theme.scss and unruly-board.scss.
const BOARD = '#fffdf8';
const EMPTY = '#d4d0c8';
const BLACK = '#2b2d33';
const WHITE = '#ffffff';
const WHITE_EDGE = '#b9b4aa';
const GAP = 0.05; // as on the board

/** The icon in board units, centred on the 2×2 block from (0, 0) to (2, 2). */
function svg(zoomOut) {
  const half = 1.3 * zoomOut;
  const [cx, cy] = [1, 1];
  const tiles = [];
  for (let y = -3; y <= 4; y++) {
    for (let x = -3; x <= 4; x++) {
      const inBlock = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      const colour = !inBlock ? 'empty' : (x + y) % 2 === 0 ? 'black' : 'white';
      const fill = colour === 'black' ? BLACK : colour === 'white' ? WHITE : EMPTY;
      const edge = colour === 'white' ? ` stroke="${WHITE_EDGE}" stroke-width="0.03"` : '';
      tiles.push(
        `<rect x="${x + GAP}" y="${y + GAP}" width="${1 - 2 * GAP}" height="${1 - 2 * GAP}" rx="0.12" fill="${fill}"${edge}/>`,
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cx - half} ${cy - half} ${2 * half} ${2 * half}">
  <rect x="-5" y="-5" width="13" height="12" fill="${BOARD}"/>
  ${tiles.join('\n  ')}
</svg>`;
}

makeAppIcon(resolve(import.meta.dirname, '..'), svg, BOARD);
