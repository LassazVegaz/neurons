import * as fs from "node:fs";
import * as path from "node:path";
import { Network, type ModelParameters } from "./lib/Neurone.js";

const FILE_THETAS = path.join("data", "params.json");
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

const saveThetas = (thetas: ModelParameters) => {
  fs.writeFileSync(FILE_THETAS, JSON.stringify(thetas), {
    encoding: "utf-8",
  });
};

const getThetas = (newThetas: boolean, network: Network) => {
  if (newThetas || !fs.existsSync(FILE_THETAS))
    saveThetas(network.createThetas());

  const json = fs.readFileSync(FILE_THETAS, { encoding: "utf-8" });
  return JSON.parse(json) as ModelParameters;
};

// y = x
const f = (x: number) => x;

type Params = {
  clearThetas: boolean;
  alpha: number;
  iterations: number;
};

const main = (p: Params) => {
  const data = getData();
  const network = new Network(f, [1, 2, 1]);
  const thetas = getThetas(p.clearThetas, network);

  network.train({
    inputs: data,
    thetas,
    alpha: p.alpha,
    iterations: p.iterations,
  });

  saveThetas(thetas);

  console.log("\nFinished training.....");
  console.log(`Last Ws -> ${thetas.w}\nLast Bs -> ${thetas.b}`);

  const testData = [1, 2, 1026.9854, 101.01, 32];
  for (const x of testData) {
    const prediction = network.predict(x, thetas);
    console.log(`x = ${x}, y =${prediction}`);
  }
};

const getValueParam = <T>(
  name: string,
  converter: (input: string) => T,
  validator?: (p: T) => boolean,
): T | null => {
  if (!process.argv.includes(name)) return null;

  const idx = process.argv.indexOf(name) + 1;
  const paramStr = process.argv[idx];
  const _p = converter(paramStr);
  if (validator && !validator(_p)) return null;
  return _p;
};

const nanValidator = (n: number) => !Number.isNaN(n);

const builParams = (): Params => {
  const clearThetas = process.argv.includes("-c");
  const alpha = getValueParam("-a", Number.parseFloat, nanValidator) ?? 0.1;
  const iterations =
    getValueParam("-i", Number.parseInt, nanValidator) ?? 10000;

  return {
    clearThetas,
    alpha,
    iterations,
  };
};

main(builParams());
