type ErrorAdder = () => number;

export class MSECalculator {
  private prevMSE = 1;
  private MSE = 0;

  private calculateMse = false;
  private itr = 0;
  set iteration(v: number) {
    this.itr = v;
    this.calculateMse = (v + 1) % this.iterationBreaker === 0 || v === 0;
  }

  constructor(
    private readonly iterationBreaker: number,
    private readonly m: number,
    private readonly f: (x: number) => number,
  ) {}

  addError(x: number, predicted: number) {
    if (this.calculateMse) this.MSE += (this.f(x) - predicted) ** 2;
  }

  finishIteration() {
    if (this.calculateMse) {
      this.MSE /= 2 * this.m;
      const mseDiff = this.prevMSE - this.MSE;
      const mseDiffPerc = (100 * mseDiff) / this.prevMSE;
      console.log(
        `MSE at ${this.itr} = ${this.MSE} (${-mseDiffPerc.toFixed(2)}%)`,
      );
      this.prevMSE = this.MSE;
    }
  }
}
