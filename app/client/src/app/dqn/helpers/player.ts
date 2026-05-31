type OnNumericChange = (idx: number) => void;

const SPEED = Number.parseInt(process.env.NEXT_PUBLIC_PLAYER_SPEED || "100");

const BOX_PLAYER_CLASS = "box-player" as const;

type Coord = { x: number; y: number };

export default class Player {
  private games: number[][] = [];
  private currentTimer: NodeJS.Timeout | undefined;
  private currentGame = -1;
  private running = false;
  private lastPlayerState: Coord = { x: 0, y: 0 };
  private bestGame: number[] | undefined;

  private _onGameChange: OnNumericChange | undefined;
  set onGameChange(v: OnNumericChange) {
    this._onGameChange = v;
  }

  addGame(actions: number[]) {
    if (this.bestGame) {
      this.games[this.games.length - 1] = actions;
      this.games.push(this.bestGame);
    } else {
      this.games.push(actions);
    }

    if (!this.running) this.playNextGame();
  }

  addBestGame(actions: number[]) {
    this.bestGame = actions;
    this.games.push(this.bestGame);
    if (!this.running) this.playNextGame();
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

  private runGame(actions: number[]) {
    let period = -1;
    const s: Coord = { x: 0, y: 0 };
    this.running = true;

    this.transitState(s);

    this.currentTimer = setInterval(() => {
      period++;
      if (period === actions.length) {
        this.stopTimmer();
        this.playNextGame();
        return;
      }

      const a = actions[period];

      if (a === 0 && s.y > 0) s.y--;
      else if (a === 1 && s.x < 9) s.x++;
      else if (a === 2 && s.y < 9) s.y++;
      else if (a === 3 && s.x > 0) s.x--;

      this.transitState(s);
    }, SPEED);
  }

  private transitState(newState: Coord) {
    this.toggleBox(this.lastPlayerState, false);
    this.toggleBox(newState, true);
    this.lastPlayerState = { ...newState };
  }

  private stopTimmer() {
    clearInterval(this.currentTimer);
    this.running = false;
  }

  private toggleBox(state: Coord, show: boolean): void {
    const id = `box-${state.x}-${state.y}`;
    const ele = document.getElementById(id);
    if (!ele) throw new Error(`Box with id ${id} is missing`);

    if (show) ele.classList.add(BOX_PLAYER_CLASS);
    else ele.classList.remove(BOX_PLAYER_CLASS);
  }
}

// ACTIONS: up, right, down, left
