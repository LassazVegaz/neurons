export default class Statistics {
  private _mean: number | undefined;
  private _standardDeviation: number | undefined;

  constructor(private readonly arr: number[]) {}

  get mean() {
    this._mean ??=
      this.arr.reduce((pre, cur) => pre + cur, 0) / this.arr.length;
    return this._mean;
  }

  get standardDeviation() {
    if (this._standardDeviation === undefined) {
      const squareSum = this.arr.reduce(
        (pre, cur) => pre + (cur - this.mean) ** 2,
        0,
      );
      this._standardDeviation = Math.sqrt(squareSum / this.arr.length);
    }

    return this._standardDeviation;
  }
}
