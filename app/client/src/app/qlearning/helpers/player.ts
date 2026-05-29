type OnGameChange = (idx: number) => void;

export default class Player {
  private games: number[][] = [];
  private currentTimer: NodeJS.Timeout | undefined;
  private currentGame = -1;
  private running = false;

  private _onGameChange: OnGameChange | undefined;
  set onGameChange(v: OnGameChange) {
    this._onGameChange = v;
  }

  addGame(actions: number[]) {
    this.games.push(actions);
    if (!this.running) this.playNextGame();
  }

  reset() {
    this.stopTimmer();
    this.games = [];
    this.currentGame = -1;
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
    let s = 0;
    this.running = true;

    this.currentTimer = setInterval(() => {
      period++;
      if (period === actions.length) {
        this.stopTimmer();
        this.playNextGame();
        return;
      }
      const a = actions[period];

      document.getElementById("box-" + s)?.classList.remove("box-player");

      if (a === 0 && s > 9) s -= 10;
      else if (a === 1 && s % 10 !== 9) s++;
      else if (a === 2 && s < 89) s += 10;
      else if (a === 3 && s % 10 !== 0) s--;

      document.getElementById("box-" + s)?.classList.add("box-player");
    }, 1000);
  }

  private stopTimmer() {
    clearInterval(this.currentTimer);
    this.running = false;
  }
}

// ACTIONS: up, right, down, left
