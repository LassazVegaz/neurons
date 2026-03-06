import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT is not defined in environment variables");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on localhost:${PORT}`);
});
