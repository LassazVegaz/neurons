import * as fs from "node:fs";
import * as path from "node:path";

type Params = { w: number[]; b: number[] };

const FILE_PARAMETERS = path.join("data", "params.json");
const FILE_TRAINING_DATA = path.join("data", "trainingData.json");

const INITIAL_WS = [0.1, 0.2, 0.3, 0.4];
const INITIAL_BS = [0.5, 0.6, 0.7];

const createData = () => {
  const nums: number[] = [];
  for (let i = 0; i < 1000; i++) {
    nums.push(Math.random() * 100);
  }

  fs.writeFileSync(FILE_TRAINING_DATA, JSON.stringify(nums), {
    encoding: "utf8",
  });
};

const getData = () => {
  if (!fs.existsSync(FILE_TRAINING_DATA)) createData();

  const str = fs.readFileSync(FILE_TRAINING_DATA, { encoding: "utf8" });
  const nums = JSON.parse(str) as number[];
  return nums;
};

const saveParams = (p: Params) => {
  fs.writeFileSync(FILE_PARAMETERS, JSON.stringify(p), {
    encoding: "utf-8",
  });
};

const getParams = (newParams: boolean) => {
  if (newParams || !fs.existsSync(FILE_PARAMETERS))
    saveParams({ w: INITIAL_WS, b: INITIAL_BS });

  const json = fs.readFileSync(FILE_PARAMETERS, { encoding: "utf-8" });
  return JSON.parse(json) as Params;
};

const relU = (x: number) => Math.max(0, x);
const dRelU = (x: number) => (x === 0 ? 0 : 1);

// y = x
const f = (x: number) => 5 * x;

const forward = (x: number, p: Params) => {
  const y0 = x * p.w[0] + p.b[0];
  const y1 = x * p.w[1] + p.b[1];

  const n0 = relU(y0);
  const n1 = relU(y1);

  const y2 = n0 * p.w[2];
  const y3 = n1 * p.w[3];

  const h = y2 + y3 + p.b[2];

  return { y0, y1, n0, n1, h };
};

const main = (clearParams = false) => {
  const data = getData();
  const max = Math.max(...data);
  const a = 0.01;

  let { w, b } = getParams(clearParams);

  // x => w.x + b => y

  // MSE = mean square error = 0.5 * sum of square errors / number of training data (n)
  let MSE = 0,
    newMSE = 0;
  for (let round = 0; round < 1000000; round++) {
    // refer to the diagram for derivatives

    const dW: number[] = [0, 0, 0, 0],
      dB: number[] = [0, 0, 0];

    for (const _x of data) {
      const x = _x / max;
      const { y0, y1, n0, n1, h } = forward(x, { w, b });
      const y = f(x);
      const e = y - h;

      dB[2] += -e;
      dB[1] += -w[3] * dRelU(y1) * e;
      dB[0] += -w[2] * dRelU(y0) * e;

      dW[3] += -n1 * e;
      dW[2] += -n0 * e;
      dW[1] += -w[3] * dRelU(y1) * x * e;
      dW[0] += -w[2] * dRelU(y0) * x * e;

      newMSE += e ** 2;
    }

    const n = data.length;
    newMSE = (0.5 * newMSE) / n;
    const MSEGap = newMSE - MSE;
    MSE = newMSE;

    for (let i = 0; i < b.length; i++) b[i] -= (dB[i] / n) * a;
    for (let i = 0; i < w.length; i++) w[i] -= (dW[i] / n) * a;

    if (round % 100000 === 0)
      console.log(`${round} MSE -> ${MSE} (${MSEGap > 0 ? "+" : ""}${MSEGap})`);
    if (round % 200000 === 0)
      console.log(`${round} Ws -> ${w}\n${round} Bs -> ${b}`);
  }

  saveParams({ w, b });

  console.log("\nFinished training.....");
  console.log(`Last MSE -> ${MSE}`);
  console.log(`Last Ws -> ${w}\nLast Bs -> ${b}`);

  const testData = [1, 2, 1026.9854, 101.01, 32];
  for (const d of testData) {
    const fwd = forward(d, { w, b });
    console.log(`x = ${d}, y =${fwd.h}`);
  }
};

const clearParams = process.argv[2]?.toLowerCase() === "c";

main(clearParams);
