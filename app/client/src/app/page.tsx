"use client";
import { useEffect, useState } from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { FinishedTrainingResults } from "shared";
import { io } from "socket.io-client";
import ControlPanel from "./components/ControlPanel";
import Socket from "@/types/socket.type";

let socket: Socket | undefined;

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [trainingResults, setTrainingResults] =
    useState<FinishedTrainingResults>([]);

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl)
      throw new Error(
        "NEXT_PUBLIC_SERVER_URL is not defined in environment variables",
      );
    socket = io(serverUrl);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("finishedTraining", (res) => {
      setTrainingResults(res);
    });

    return () => {
      if (!socket) return;

      socket.off("connect");
      socket.off("disconnect");
      socket.off("finishedTraining");
      socket.disconnect();
      socket = undefined;
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

      <ControlPanel socket={socket} connectedToServer={connected} />

      {!connected && (
        <div className="bg-green-800 text-white fixed bottom-0 left-0 w-full text-center p-1">
          <div className="text-gray-300 text-xs">Connecting to server</div>
        </div>
      )}
    </div>
  );
}
