import * as fs from "node:fs";
import * as path from "node:path";

type Params = { w1: number; w2: number; b: number };

const FILE_PARAMETERS = path.join("data", "params.json");
const FILE_TRAINING_DATA = path.join("data", "trainingData.json");

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

const getParams = () => {
  if (!fs.existsSync(FILE_PARAMETERS)) saveParams({ w1: 0, w2: 0, b: 0 });

  const json = fs.readFileSync(FILE_PARAMETERS, { encoding: "utf-8" });
  return JSON.parse(json) as Params;
};

// y = x^2 + 2x + 5
const f = (x: number) => x ** 2 + 2 * x + 5;

const forward = (x: number, p: Params) => x ** 2 * p.w1 + x * p.w2 + p.b;

const main = () => {
  const data = getData();
  const max = Math.max(...data);
  const a = 0.001;

  let { w1, w2, b } = getParams();

  // x => w.x + b => y

  // MSE = mean square error = 0.5 * sum of square errors / number of training data (n)
  let MSE = 0;
  for (let round = 0; round < 10000; round++) {
    // dW = 0.5 * -xi * sum of errors / n
    // dB = 0.5 * -sum of errors / n

    let dW1 = 0,
      dW2 = 0,
      dB = 0;

    for (const _x of data) {
      const x = _x / max;
      const h = forward(x, { w1, w2, b });
      const y = f(x);
      const e = y - h;
      dW1 += -(x ** 2) * e;
      dW2 += -x * e;
      dB += -e;
      MSE += e ** 2;
    }

    const n = data.length;
    MSE = (0.5 * MSE) / n;
    w1 -= (dW1 / n) * a;
    w2 -= (dW2 / n) * a;
    b -= (dB / n) * a;

    if (round % 1000 === 0)
      console.log(`${round} -> ${MSE} : {${w1} ${w2} ${b}}`);
  }

  saveParams({ w1, w2, b });

  console.log("Finished training.....");
  console.log(`Last MSE -> ${MSE} : {${w1} ${w2} ${b}}`);
  const testData = [1, 1026.9854, 101.01, 32];
  for (const d of testData) {
    console.log(`x = ${d}, y =${forward(d, { w1, w2, b })}`);
  }
};

main();
