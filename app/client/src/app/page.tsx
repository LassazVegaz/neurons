"use client";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
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
      socket.off("finishedTraining");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-[1fr_auto]">
      <div className="p-4 w-full h-full">
        <ResponsiveContainer>
          <LineChart
            className="bg-gray-800 rounded-lg"
            data={[
              { name: 0, value: 0 },
              { name: 1, value: 1 },
              { name: 2, value: 2 },
              { name: 3, value: 3 },
              { name: 4, value: 4 },
              { name: 5, value: 5 },
            ]}
          >
            <Line dataKey="value" />
            <XAxis dataKey="name" />
            <YAxis />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
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

      {!connected && (
        <div className="bg-green-800 text-white fixed bottom-0 left-0 w-full text-center p-1">
          <div className="text-gray-300 text-xs">Connecting to server</div>
        </div>
      )}
    </div>
  );
}
