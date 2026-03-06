import { createServer } from "node:http";
import { Server } from "socket.io";
import { Network } from "neurons";
import ss from "./lib/storage-service";
import {
  ClientToServerEvents,
  FinishedTrainingResults,
  ServerToClientEvents,
} from "shared";

const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT is not defined in environment variables");

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
  },
});

const f = (x: number) => x;

io.on("connection", (socket) => {
  console.log(`a user connected (${socket.id})`);

  socket.on("disconnect", () => {
    console.log(`user disconnected (${socket.id})`);
  });

  socket.on("train", (p) => {
    console.log("Starting training...");
    const network = new Network(f, p.layers);
    const thetas = ss.getThetas(p.newThetas, network);
    const inputs = ss.getData();

    network.train({
      alpha: p.alpha,
      iterations: p.iterations,
      inputs,
      thetas,
    });

    ss.saveThetas(thetas);

    const results: FinishedTrainingResults = inputs.map((input) => {
      const prediction = network.predict(input, thetas);
      return { actual: input, prediction };
    });

    socket.emit("finishedTraining", results);
  });
});

httpServer.listen(PORT, () => {
  console.log(`lisTening on localhost:${PORT}`);
});
