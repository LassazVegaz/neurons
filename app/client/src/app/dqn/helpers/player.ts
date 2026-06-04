import { GameResults } from "@/signalr/dqn.hub.types";

type OnNumericChange = (idx: number) => void;

const SPEED = Number.parseInt(process.env.NEXT_PUBLIC_PLAYER_SPEED || "100");

const BOX_PLAYER_CLASS = "box-player" as const;
const BOX_OPPONENT_CLASS = "box-opponent" as const;

export type Game = Pick<GameResults, "states">;

export default class Player {
  private games: Game[] = [];
  private currentTimer: NodeJS.Timeout | undefined;
  private currentGame = -1;
  private running = false;
  private lastStates: number[] = [0, 0, 9, 9];
  private bestGame: Game | undefined;

  public autoPlay = true;

  private _onGameChange: OnNumericChange | undefined;
  set onGameChange(v: OnNumericChange | undefined) {
    this._onGameChange = v;
  }

  private _onPlayingFinished: (() => void) | undefined;
  set onPlayingFinished(v: (() => void) | undefined) {
    this._onPlayingFinished = v;
  }

  addGame(game: Game) {
    if (this.bestGame) {
      this.games[this.games.length - 1] = game;
      this.games.push(this.bestGame);
    } else {
      this.games.push(game);
    }

    if (!this.running && this.autoPlay) this.playNextGame();
  }

  addBestGame(game: Game) {
    this.bestGame = game;
    this.games.push(this.bestGame);
    if (!this.running && this.autoPlay) this.playNextGame();
  }

  reset() {
    this.stopTimmer();
    this.games = [];
    this.currentGame = -1;
    this.bestGame = undefined;
    this._onGameChange?.(this.currentGame);
  }

  pause() {
    this.stopTimmer();
  }

  resume() {
    if (this.running) return;

    if (this.games.length === 0) return;
    if (this.currentGame >= this.games.length || this.currentGame < 0)
      this.currentGame = 0;

    this._onGameChange?.(this.currentGame);
    this.runGame(this.games[this.currentGame]);
  }

  playFrom(gameIndex: number) {
    if (gameIndex < 0 || gameIndex >= this.games.length)
      throw new Error("Invalid game index: " + gameIndex);

    this.stopTimmer();
    this.currentGame = gameIndex - 1;
    this.playNextGame();
  }

  playBestGame() {
    if (this.bestGame === undefined) throw new Error("Best game is not given");

    this.stopTimmer();
    this.currentGame = this.games.length - 2;
    this.playNextGame();
  }

  private playNextGame() {
    this.stopTimmer();

    if (this.games.length === 0) return;
    this.currentGame++;
    if (this.currentGame === this.games.length) this.currentGame = 0;

    this._onGameChange?.(this.currentGame);
    this.runGame(this.games[this.currentGame]);
  }

  private runGame(game: Game) {
    const states = game.states;
    let period = -1;
    this.running = true;

    this.currentTimer = setInterval(() => {
      period++;
      if (period === states.length) {
        this.stopTimmer();
        if (this.autoPlay) this.playNextGame();
        else this._onPlayingFinished?.();
        return;
      }
      this.transitState(states[period]);
    }, SPEED);
  }

  private transitState(newStates: number[]) {
    this.toggleBoxes(this.lastStates, false);
    this.toggleBoxes(newStates, true);
    this.lastStates = [...newStates];
  }

  private stopTimmer() {
    clearInterval(this.currentTimer);
    this.running = false;
  }

  private toggleBoxes(states: number[], show: boolean): void {
    const pId = `box-${states[0]}-${states[1]}`;
    const oId = `box-${states[2]}-${states[3]}`;
    const pEle = document.getElementById(pId);
    const oEle = document.getElementById(oId);
    if (!pEle || !oEle)
      throw new Error(`Box with id ${pId} or ${oId} is missing`);

    if (show) {
      pEle.classList.add(BOX_PLAYER_CLASS);
      oEle.classList.add(BOX_OPPONENT_CLASS);
    } else {
      pEle.classList.remove(BOX_PLAYER_CLASS);
      oEle.classList.remove(BOX_OPPONENT_CLASS);
    }
  }
}

// ACTIONS: up, right, down, left
