import { Network } from "./lib/Neurone.js";
import pb from "./lib/ParametersBuilder.js";
import ss from "./lib/StorageService.js";
import MainParameters from "./types/main-parameters.type.js";

// y = x
const f = (x: number) => x * x;

const main = (p: MainParameters) => {
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

main(pb.builParams());
