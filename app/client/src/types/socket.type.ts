import { ServerToClientEvents, ClientToServerEvents } from "shared";
import { Socket as SocketIo } from "socket.io-client";

type Socket = SocketIo<ServerToClientEvents, ClientToServerEvents>;
export default Socket;
