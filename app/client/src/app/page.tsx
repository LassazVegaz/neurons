"use client";
import { useEffect, useState } from "react";
import { ClientToServerEvents, ServerToClientEvents } from "shared";
import { io, Socket } from "socket.io-client";

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
if (!serverUrl)
  throw new Error(
    "NEXT_PUBLIC_SERVER_URL is not defined in environment variables",
  );

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(serverUrl);

enum TrainingStatus {
  NotStarted,
  InProgress,
  Finished,
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(
    TrainingStatus.NotStarted,
  );

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("finishedTraining", () => {
      setTrainingStatus(TrainingStatus.Finished);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <div>
      Hello World
      <div>{connected ? "Connected" : "Disconnected"}</div>
      <div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            socket.emit("train", {
              layers: [1, 2, 1],
              newThetas: true,
              alpha: 0.01,
              iterations: 10000,
            });
            setTrainingStatus(TrainingStatus.InProgress);
          }}
        >
          Start
        </button>
      </div>
      <div>
        {trainingStatus === TrainingStatus.NotStarted &&
          "Click start to begin training."}
        {trainingStatus === TrainingStatus.InProgress &&
          "Training in progress..."}
        {trainingStatus === TrainingStatus.Finished && "Training finished!"}
      </div>
    </div>
  );
}
