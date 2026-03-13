import { Network } from "neurons";
import {
  ClientToServerEvents,
  FinishedTrainingResults,
  ServerToClientEvents,
} from "shared";
import { Socket } from "socket.io";
import ss from "./lib/storage-service";

const DEFAULT_ITERATION_BREAKPOINT = 5000;

const f = (x: number) => x;

const train = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  p: Parameters<ClientToServerEvents["train"]>[0],
) => {
  console.log("Starting training...");
  console.log("Parameters:", p);
  const network = new Network(f, p.layers);
  const inputs = ss.getData();
  const model = ss.getModel(p.newThetas, inputs, network);
  const iterationBreakpoint =
    p.iterations > 10_000 ? DEFAULT_ITERATION_BREAKPOINT : p.iterations / 10;

  const MSEs: number[] = [];
  network.on("iterationFinish", (i, mse) => {
    MSEs.push(mse);
    if (i % iterationBreakpoint === 0 || i === p.iterations - 1)
      socket.emit("iterationsBreak", i, MSEs);
  });

  network.on("trainingFinish", () => {
    console.log("Training finished...");

    const results: FinishedTrainingResults = inputs.map((input) => {
      const prediction = network.predict(input, model);
      return { x: input, actual: f(input), prediction };
    });

    ss.saveModel(model);

    socket.emit("finishedTraining", results);
  });

  network.train({
    alpha: p.alpha,
    iterations: p.iterations,
    inputs,
    thetas: model.thetas,
    norm: model.norm,
  });

  socket.on("requestToStopTraining", () => {
    network.requestToStop();
    socket.emit("requestToStopTrainingFulfilled");
  });
};

export default train;
