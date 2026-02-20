import { Network } from "./lib/Neurone.js";
import ss from "./lib/StorageService.js";

// y = x
const f = (x: number) => x * x;

type Params = {
  clearThetas: boolean;
  alpha: number;
  iterations: number;
};

const main = (p: Params) => {
  const data = ss.getData();
  const network = new Network(f, [1, 10, 10, 1]);
  const thetas = ss.getThetas(p.clearThetas, network);

  network.train({
    inputs: data,
    thetas,
    alpha: p.alpha,
    iterations: p.iterations,
  });

  ss.saveThetas(thetas);

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
