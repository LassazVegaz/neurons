"use client";
import { useEffect, useRef, useState } from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  ClientToServerEvents,
  FinishedTrainingResults,
  ServerToClientEvents,
} from "shared";
import { io, Socket } from "socket.io-client";
import { Checkbox, TextField } from "./components";

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
if (!serverUrl)
  throw new Error(
    "NEXT_PUBLIC_SERVER_URL is not defined in environment variables",
  );

enum TrainingStatus {
  NotStarted,
  InProgress,
  Finished,
}

export default function Home() {
  const socketRef =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(null);
  const [connected, setConnected] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(
    TrainingStatus.NotStarted,
  );
  const [trainingResults, setTrainingResults] =
    useState<FinishedTrainingResults>([]);
  const [form, setForm] = useState({
    alpha: "0.01",
    iterations: "10000",
    useNewThetas: true,
    layers: "1,2,1",
  });

  useEffect(() => {
    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("finishedTraining", (res) => {
      setTrainingStatus(TrainingStatus.Finished);
      setTrainingResults(res);
      setForm((prev) => ({ ...prev, useNewThetas: false }));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("finishedTraining");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-[1fr_200px]">
      <div className="p-4 w-full h-full">
        <LineChart
          className="bg-gray-800 rounded-lg"
          width="100%"
          height="100%"
          data={trainingResults}
        >
          <Line dataKey="actual" dot={false} stroke="blue" />
          <Line dataKey="prediction" dot={false} stroke="red" />
          <XAxis dataKey="x" type="number" />
          <YAxis />
          <Tooltip
            labelStyle={{ color: "black" }}
            contentStyle={{
              backgroundColor: "#999",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#333" }}
          />
        </LineChart>
      </div>
      <div className="flex flex-col gap-4 pt-4 pr-4">
        <Checkbox
          label="Use new thetas"
          name="useNewThetas"
          checked={form.useNewThetas}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, useNewThetas: e.target.checked }))
          }
        />
        <TextField
          label="Alpha (learning rate)"
          name="alpha"
          value={form.alpha}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, alpha: e.target.value }))
          }
        />
        <TextField
          label="Iterations"
          name="iterations"
          value={form.iterations}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, iterations: e.target.value }))
          }
        />
        <TextField
          label="Layers"
          name="layers"
          value={form.layers}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, layers: e.target.value }))
          }
        />
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              socketRef.current?.emit("train", {
                layers: form.layers.split(",").map(Number),
                newThetas: form.useNewThetas,
                alpha: parseFloat(form.alpha),
                iterations: parseInt(form.iterations),
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
