import { createServer } from "node:http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "shared";
import train from "./train";

const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT is not defined in environment variables");

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`a user connected (${socket.id})`);
  console.log(`Total users: ${io.engine.clientsCount}`);

  socket.on("disconnect", () => {
    console.log(`user disconnected (${socket.id})`);
    console.log(`Total users: ${io.engine.clientsCount}`);
  });

  socket.on("train", (p) => train(socket, p));
});

httpServer.listen(PORT, () => {
  console.log(`lisTening on localhost:${PORT}`);
});
