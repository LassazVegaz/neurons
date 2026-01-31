import * as fs from "node:fs";
import * as path from "node:path";

import { Network, type Params } from "./lib/Neurone";

const FILE_PARAMETERS = path.join("data", "params.json");
const FILE_TRAINING_DATA = path.join("data", "trainingData.json");

const createData = () => {
  const nums: number[] = [];
  for (let i = 0; i < 1000; i++) {
    nums.push(Math.random() * 100);
  }

  fs.mkdirSync(path.dirname(FILE_TRAINING_DATA), { recursive: true });
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
  fs.mkdirSync(path.dirname(FILE_PARAMETERS), { recursive: true });
  fs.writeFileSync(FILE_PARAMETERS, JSON.stringify(p), {
    encoding: "utf-8",
  });
};

const getParams = (network: Network, newParams: boolean) => {
  if (newParams || !fs.existsSync(FILE_PARAMETERS)) {
    saveParams(network.createRandomParams());
  }

  const json = fs.readFileSync(FILE_PARAMETERS, { encoding: "utf-8" });
  return JSON.parse(json) as Params;
};

// y = x
const f = (x: number) => 5 * x;

const main = (clearParams = false) => {
  const network = new Network([1, 2, 2, 1]);
  const data = getData();
  const max = Math.max(...data);
  const a = 0.01;

  let params = getParams(network, clearParams);

  // x => w.x + b => y

  // MSE = mean square error = 0.5 * sum of square errors / number of training data (n)
  let MSE = 0,
    newMSE = 0;
  for (let round = 0; round < 1000000; round++) {
    const dParams = network.createZeroParams();

    newMSE = 0;
    for (const _x of data) {
      const x = _x / max;
      const y = f(x);
      const { gradients, loss } = network.backward([x], [y], params);

      for (let layer = 0; layer < dParams.weights.length; layer++) {
        for (let neuron = 0; neuron < dParams.weights[layer].length; neuron++) {
          dParams.biases[layer][neuron] += gradients.biases[layer][neuron];
          for (
            let prev = 0;
            prev < dParams.weights[layer][neuron].length;
            prev++
          ) {
            dParams.weights[layer][neuron][prev] +=
              gradients.weights[layer][neuron][prev];
          }
        }
      }

      newMSE += loss;
    }

    const n = data.length;
    newMSE = newMSE / n;
    const MSEGap = newMSE - MSE;
    MSE = newMSE;

    for (let layer = 0; layer < params.weights.length; layer++) {
      for (let neuron = 0; neuron < params.weights[layer].length; neuron++) {
        params.biases[layer][neuron] -= (dParams.biases[layer][neuron] / n) * a;
        for (
          let prev = 0;
          prev < params.weights[layer][neuron].length;
          prev++
        ) {
          params.weights[layer][neuron][prev] -=
            (dParams.weights[layer][neuron][prev] / n) * a;
        }
      }
    }

    if (round % 100000 === 0)
      console.log(`${round} MSE -> ${MSE} (${MSEGap > 0 ? "+" : ""}${MSEGap})`);
    if (round % 200000 === 0)
      console.log(
        `${round} Ws -> ${JSON.stringify(params.weights)}\n${round} Bs -> ${JSON.stringify(params.biases)}`,
      );
  }

  saveParams(params);

  console.log("\nFinished training.....");
  console.log(`Last MSE -> ${MSE}`);
  console.log(
    `Last Ws -> ${JSON.stringify(params.weights)}\nLast Bs -> ${JSON.stringify(params.biases)}`,
  );

  const testData = [1, 2, 1026.9854, 101.01, 32];
  for (const d of testData) {
    const normalized = d / max;
    const { activations } = network.forward([normalized], params);
    const h = activations[activations.length - 1][0];
    console.log(`x = ${d}, y =${h}`);
  }
};

const clearParams = process.argv[2]?.toLowerCase() === "c";

main(clearParams);
