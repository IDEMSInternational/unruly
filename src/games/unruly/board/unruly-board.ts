import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { BoardFinger } from '@studio/container/board-finger';
import { placeLabel } from '@studio/container/board-label';
import { BoardLabelView } from '@studio/container/board-label-view';
import { BoardPointer } from '@studio/container/board-pointer';
import { EMPTY, ONE } from '../description';
import { UnrulyTouch } from '../input';
import { UnrulyMove } from '../moves';
import { Run, UnrulyState, findMistakes } from '../state';
import { UnrulyHint } from '../tutorial';

/** Gap around each square's tile, in squares. */
const GAP = 0.05;
/** Inset of a given square's thin inner border. */
const GIVEN_INSET = 0.2;
/** Inset of a tentative (thinking-mode) square's smaller tile. */
const TENTATIVE_INSET = 0.22;

/**
 * The outlines around three-in-a-rows, in squares: overlapping ones in the
 * same line are merged, so four blacks side by side get one outline round
 * all four, not two crossing ones.
 */
export function outlines(runs: readonly Run[], w: number): Rect[] {
  const merged: Rect[] = [];
  for (const horizontal of [true, false]) {
    const starts = runs
      .filter((r) => r.horizontal === horizontal)
      .map((r) => ({ x: r.start % w, y: Math.floor(r.start / w) }))
      // Along each line in turn: rows top to bottom, or columns left to right.
      .sort((a, b) => (horizontal ? a.y - b.y || a.x - b.x : a.x - b.x || a.y - b.y));
    let last: Rect | null = null;
    for (const { x, y } of starts) {
      if (last && horizontal && y === last.y && x === last.x + last.w - 2) last.w++;
      else if (last && !horizontal && x === last.x && y === last.y + last.h - 2) last.h++;
      else merged.push((last = { x, y, w: horizontal ? 3 : 1, h: horizontal ? 1 : 3 }));
    }
  }
  return merged;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Board for Unruly, drawn as SVG in square units. Emits moves; never changes state itself. */
@Component({
  selector: 'unruly-board',
  imports: [BoardFinger, BoardLabelView],
  templateUrl: './unruly-board.html',
  styleUrl: './unruly-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnrulyBoard {
  readonly state = input.required<UnrulyState>();
  /** Tutorial guidance: highlights a square and animates the tap. */
  readonly hint = input<UnrulyHint | null>(null);
  /** Thinking mode: new colours are tentative, drawn smaller. */
  readonly thinking = input(false);
  /** Show mistakes: three in a row, and colours a line has too many of, in red. */
  readonly showMistakes = input(false);
  readonly move = output<UnrulyMove>();

  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  /** The finger on the board. */
  private readonly pointer = new BoardPointer<UnrulyTouch>(() => this.svg().nativeElement);

  protected readonly gap = GAP;
  protected readonly givenInset = GIVEN_INSET;
  protected readonly tentativeInset = TENTATIVE_INSET;

  protected readonly viewBox = computed(() => {
    const { w, h } = this.state();
    return `-0.1 -0.1 ${w + 0.2} ${h + 0.2}`;
  });

  /** Everything on the board, square by square. */
  protected readonly view = computed(() => {
    const state = this.state();
    const mistakes = this.showMistakes() ? findMistakes(state) : null;
    const squares = Array.from(state.cells, (value, i) => ({
      x: i % state.w,
      y: Math.floor(i / state.w),
      colour: value === EMPTY ? 'empty' : value === ONE ? 'black' : 'white',
      given: state.givens[i] !== EMPTY,
      tentative: state.tentative[i] === 1,
      overfull: !!mistakes?.overfull.has(i),
    }));
    return { squares, runs: outlines(mistakes?.runs ?? [], state.w) };
  });

  /** The hinted square, and where the animated finger taps. */
  protected readonly hintView = computed(() => {
    const hint = this.hint();
    if (!hint) return null;
    return { square: hint.square, tap: { x: hint.square.x + 0.5, y: hint.square.y + 0.5 } };
  });

  /** A tutorial note about the hinted square, e.g. "Three in a row". */
  protected readonly noteLabel = computed(() => {
    const hint = this.hint();
    if (!hint?.note) return null;
    const { x, y } = hint.square;
    return placeLabel(hint.note, { x, y, w: 1, h: 1 }, this.state());
  });

  protected onPointerDown(event: PointerEvent): void {
    this.pointer.down(
      event,
      (at) => new UnrulyTouch(this.state(), at, { thinking: this.thinking() }),
    );
  }

  protected onPointerMove(event: PointerEvent): void {
    this.pointer.move(event);
  }

  protected onPointerUp(event: PointerEvent): void {
    const move = this.pointer.up(event)?.finish();
    if (move) this.move.emit(move);
  }

  protected cancelTouch(): void {
    this.pointer.cancel();
  }
}
