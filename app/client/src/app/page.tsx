"use client";
import { useEffect, useState } from "react";
import { FinishedTrainingResults } from "shared";
import { io } from "socket.io-client";
import ControlPanel from "./components/ControlPanel";
import Socket from "@/types/socket.type";
import { MseChart, MseChartProps, PredictionsChart } from "./components/Charts";

let socket: Socket | undefined;

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [trainingResults, setTrainingResults] =
    useState<FinishedTrainingResults>([]);
  const [mseChartData, setMseChartData] = useState<MseChartProps["data"]>([]);

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

    socket.on("iterationsBreak", (_, MSEs) => {
      setMseChartData(MSEs.map((mse) => ({ mse })));
    });

    return () => {
      if (!socket) return;

      socket.off("connect");
      socket.off("disconnect");
      socket.off("finishedTraining");
      socket.off("iterationsBreak");
      socket.disconnect();
      socket = undefined;
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-[1fr_200px]">
      <div className="p-4 w-full h-full grid grid-rows-[1fr_1fr]">
        <PredictionsChart data={trainingResults} />
        <MseChart data={mseChartData} />
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
