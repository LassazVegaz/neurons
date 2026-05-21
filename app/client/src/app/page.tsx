"use client";
import { useEffect, useState } from "react";
import { FinishedTrainingResults } from "shared";
import { io } from "socket.io-client";
import ControlPanel from "./components/ControlPanel";
import Socket from "@/types/socket.type";
import { MseChart, MseChartProps, PredictionsChart } from "./components/Charts";
import { HubConnectionBuilder } from "@microsoft/signalr";

let socket: Socket | undefined;

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [trainingResults, setTrainingResults] =
    useState<FinishedTrainingResults>([]);
  const [mseChartData, setMseChartData] = useState<MseChartProps["data"]>([]);
  const [currentIteration, setCurrentIteration] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    let mounted = true;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl)
      throw new Error(
        "NEXT_PUBLIC_SERVER_URL is not defined in environment variables",
      );

    const connection = new HubConnectionBuilder()
      .withUrl(serverUrl + "/network")
      .build();

    connection
      .start()
      .then(() => mounted && setConnected(true))
      .catch((e) => {
        if (mounted) setConnected(false);
        console.error("SignalR connection faield", e);
      });

    socket = io(serverUrl);

    socket.on("finishedTraining", (res) => {
      setTrainingResults(res);
      setCurrentIteration(undefined);
    });

    socket.on("iterationsBreak", (itr, MSEs) => {
      setMseChartData(MSEs.map((mse, idx) => ({ x: idx + 1, mse })));
      setCurrentIteration(itr);
    });

    return () => {
      mounted = false;

      connection
        .stop()
        .catch((e) => console.error("SignalR disconnecting failed", e));

      if (!socket) return;

      socket.off("finishedTraining");
      socket.off("iterationsBreak");
      socket.disconnect();
      socket = undefined;
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-[1fr_200px]">
      <div className="p-4 w-full h-full grid grid-rows-[1fr_1fr] gap-2">
        <PredictionsChart data={trainingResults} />
        <MseChart data={mseChartData} />
      </div>

      <ControlPanel
        socket={socket}
        connectedToServer={connected}
        currentIteration={currentIteration}
      />

      {!connected && (
        <div className="bg-green-800 text-white fixed bottom-0 left-0 w-full text-center p-1">
          <div className="text-gray-300 text-xs">Connecting to server</div>
        </div>
      )}
    </div>
  );
}
