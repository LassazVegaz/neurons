import * as fs from "node:fs";
import * as path from "node:path";

const FILE_WEIGHTS = path.join("data", "weights.json");
const FILE_TRAINING_DATA = path.join("data", "trainingData.json");

/**
 * Neural Network with one hidden layer
 * Hidden layer has 2 neurons
 * One output neuron and 1 input
 */

type Parameters = {
  nInW: number[];
  nInB: number[];
  nOutW: number[];
  nOutB: number[];
  b: number;
};

type ForwardResults = {
  out: number;
  nY: number[];
  nX: number[];
};

const getTrainingData = () => {
  if (fs.existsSync(FILE_TRAINING_DATA)) {
    const data = fs.readFileSync(FILE_TRAINING_DATA, "utf-8");
    return JSON.parse(data) as number[];
  }

  console.log("Generating training data...");
  const trainingData: number[] = [];
  for (let i = 0; i <= 10000; i++) {
    const x = Math.random();
    trainingData.push(x);
  }
  fs.writeFileSync(FILE_TRAINING_DATA, JSON.stringify(trainingData));
  console.log("Training data generated.");
  return trainingData;
};

const saveParameters = (p: Parameters) => {
  fs.writeFileSync(FILE_WEIGHTS, JSON.stringify(p));
};

const loadParameters = (): Parameters => {
  if (fs.existsSync(FILE_WEIGHTS)) {
    const data = fs.readFileSync(FILE_WEIGHTS, "utf-8");
    const json = JSON.parse(data) as Parameters;
    console.log("Loaded weights:", json);
    return json;
  }
  return {
    nInW: [Math.random(), Math.random()],
    nInB: [Math.random(), Math.random()],
    nOutW: [Math.random(), Math.random()],
    nOutB: [Math.random(), Math.random()],
    b: Math.random(),
  };
};

const f = (x: number) => 2 * x + x * x; // 2x + x^2

const neuronsCount = 2;
const a = 1e-3;
let p = loadParameters();

const forward = (x: number, p: Parameters): ForwardResults => {
  const nX: number[] = [];
  const nY: number[] = [];
  let out = 0;

  for (let i = 0; i < neuronsCount; i++) {
    nX[i] = p.nInW[i] * x + p.nInB[i];
    nY[i] = Math.max(0, nX[i]);
    const nOut = p.nOutW[i] * nY[i] + p.nOutB[i];
    out += nOut;
  }

  out += p.b;

  return { out, nY, nX };
};

const reLuDerivative = (x: number) => (x > 0 ? 1 : 0);

const backward = (
  x: number,
  p: Parameters,
  e: number,
  f: ForwardResults
): Parameters => {
  // o = n1 + n2 + b
  // j = 0.5 * (y - o)^2
  // dj/dnOutB = dj/dout . dout/dnOutB = dj/dout
  // dj/dx = dj/dout . dout/dnOut . dnOut/dnY . dnY/dnX . dnX/dx
  // dj/dnOutW = dj/dout . dout/dnOut . dnOut/dnOutW
  // dj/dnInW = dj/dout . dout/dnOut . dnOut/dnY . dnY/dnX . dnX/dnInW
  // dj/dnInB = dj/dout . dout/dnOut . dnOut/dnY . dnY.dnX . dnX/dnInB

  const nInW: number[] = [];
  const nInB: number[] = [];
  const nOutW: number[] = [];
  const nOutB: number[] = [];
  const dj_dout = -e;

  for (let i = 0; i < neuronsCount; i++) {
    const dj_dnX = -e * p.nOutW[i] * reLuDerivative(f.nX[i]);
    nInW[i] = p.nInW[i] - a * dj_dnX * x;
    nInB[i] = p.nInB[i] - a * dj_dnX;
    nOutW[i] = p.nOutW[i] - a * -e * f.nY[i];
    nOutB[i] = p.nOutB[i] - a * dj_dout;
  }

  return {
    b: p.b - a * dj_dout,
    nInW,
    nInB,
    nOutB,
    nOutW,
  };
};

const train = (n = 300) => {
  let l = 0;
  let maxError = -Infinity;
  const trainingData = getTrainingData();

  for (let i = 0; i < n; i++) {
    for (const x of trainingData) {
      const y = f(x);
      const _y = forward(x, p);
      const e = y - _y.out;
      p = backward(x, p, e, _y);
      l = (y - _y.out) ** 2 / 2;

      const absE = Math.abs(e);
      if (absE > maxError) maxError = absE;
    }
  }

  return { l, maxError };
};

console.log("before", p);
const res = train(1000);
console.log("final l =", res.l, " maxError =", res.maxError);
console.log("after", p);
saveParameters(p);

for (let x = 5; x <= 10; x++) {
  console.log(`x: ${x}, f(x): ${f(x)}, h(x): ${forward(x, p).out}`);
}
