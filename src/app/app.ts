import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PuzzleHome } from '@studio/container/puzzle-home/puzzle-home';
import { PuzzleNotice } from '@studio/container/puzzle-notice/puzzle-notice';
import { PuzzleScreens } from '@studio/container/puzzle-screens';
import { PuzzleShell } from '@studio/container/puzzle-shell/puzzle-shell';
import { PuzzleStage } from '@studio/container/puzzle-stage/puzzle-stage';
import { PuzzleSplash } from '@studio/container/puzzle-splash/puzzle-splash';
import { PuzzleSwitch } from '@studio/container/puzzle-switch/puzzle-switch';
import { PuzzleTutorial } from '@studio/container/puzzle-tutorial/puzzle-tutorial';
import { UnrulyBoard } from '../games/unruly/board/unruly-board';
import { unrulyGame } from '../games/unruly/unruly-game';
import { unrulyTutorial } from '../games/unruly/tutorial';

import { version } from '../../package.json';

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
