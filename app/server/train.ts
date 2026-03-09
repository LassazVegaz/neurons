import { Network } from "neurons";
import {
  ClientToServerEvents,
  FinishedTrainingResults,
  ServerToClientEvents,
} from "shared";
import { Socket } from "socket.io";
import ss from "./lib/storage-service";

const ITERATION_BREAKPOINT = 1000;

const f = (x: number) => x;

const train = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  p: Parameters<ClientToServerEvents["train"]>[0],
) => {
  console.log("Starting training...");
  console.log("Parameters:", p);
  const network = new Network(f, p.layers);
  const thetas = ss.getThetas(p.newThetas, network);
  const inputs = ss.getData();

  const MSEs: number[] = [];
  network.on("iterationFinish", (i, mse) => {
    MSEs.push(mse);
    if (i % ITERATION_BREAKPOINT === 0 || i === p.iterations - 1)
      socket.emit("iterationsBreak", i, MSEs);
  });

  network.on("trainingFinish", (thetas) => {
    console.log("Training finished...");

    const results: FinishedTrainingResults = inputs.map((input) => {
      const prediction = network.predict(input, thetas);
      return { x: input, actual: f(input), prediction };
    });

    ss.saveThetas(thetas);

    socket.emit("trainingStatusChange", "stopped");
    socket.emit("finishedTraining", results);
  });

  socket.emit("trainingStatusChange", "started");
  network.train({
    alpha: p.alpha,
    iterations: p.iterations,
    inputs,
    thetas,
  });

  socket.on("stopTraining", () => {
    network.stopTraining();
  });
};

export default train;
