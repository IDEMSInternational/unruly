import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { PuzzleHome } from '@studio/container/puzzle-home/puzzle-home';
import { PuzzleNotice } from '@studio/container/puzzle-notice/puzzle-notice';
import { PuzzleScreens } from '@studio/container/puzzle-screens';
import { PuzzleShell } from '@studio/container/puzzle-shell/puzzle-shell';
import { PuzzleStage } from '@studio/container/puzzle-stage/puzzle-stage';
import { PuzzleSplash } from '@studio/container/puzzle-splash/puzzle-splash';
import { PuzzleSwitch } from '@studio/container/puzzle-switch/puzzle-switch';
import { PuzzleTutorial } from '@studio/container/puzzle-tutorial/puzzle-tutorial';
import { readStored, writeStored } from '@studio/container/stored-setting';
import { UnrulyBoard } from '../games/unruly/board/unruly-board';
import { ONE, ZERO } from '../games/unruly/description';
import { unrulyGame } from '../games/unruly/unruly-game';
import { unrulyTutorial } from '../games/unruly/tutorial';

import { version } from '../../package.json';

/** Where the picked colour is kept. */
const COLOUR_KEY = `${unrulyGame.id}.colour`;

@Component({
  selector: 'app-root',
  imports: [
    PuzzleHome,
    PuzzleNotice,
    PuzzleShell,
    PuzzleStage,
    PuzzleSplash,
    PuzzleSwitch,
    PuzzleTutorial,
    UnrulyBoard,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly game = unrulyGame;
  /** Home page, daily puzzles, Beat the clock, timed play and the tutorial. */
  protected readonly screens = new PuzzleScreens(unrulyGame, unrulyTutorial, version);

  /** The colour a tap gives, picked under the board; remembered on the device. */
  protected readonly colour = signal(readStored(COLOUR_KEY) === String(ZERO) ? ZERO : ONE);
  /** The tutorial's picked colour: black at the start of every tutorial. */
  protected readonly tutorialColour = signal(ONE);

  constructor() {
    effect(() => writeStored(COLOUR_KEY, String(this.colour())));
    effect(() => {
      if (this.screens.tutorial()) untracked(() => this.tutorialColour.set(ONE));
    });
  }

  /** Thinking mode: new squares are drawn smaller, to try out a hypothesis. */
  protected readonly thinking = signal(false);
  protected readonly hasThoughts = computed(
    () => this.screens.play()?.state().tentative.includes(1) ?? false,
  );

  /** Ends the hypothesis: keep its smaller squares as sure ones, or empty them. */
  protected resolveThoughts(keep: boolean): void {
    this.screens.play()?.move({ kind: keep ? 'keep-thoughts' : 'discard-thoughts' });
  }
}
