"use client";
import { useEffect, useState } from "react";
import { FinishedTrainingResults } from "shared";
import ControlPanel from "./components/ControlPanel";
import { MseChart, MseChartProps, PredictionsChart } from "./components/Charts";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";

let networkHub: HubConnection | undefined;

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
    const networkHubUrl = process.env.NEXT_PUBLIC_NETWORK_HUB;
    if (!networkHubUrl)
      throw new Error(
        "NEXT_PUBLIC_NETWORK_HUB is not defined in environment variables",
      );

    networkHub = new HubConnectionBuilder().withUrl(networkHubUrl).build();

    networkHub
      .start()
      .then(() => mounted && setConnected(true))
      .catch((e) => {
        if (mounted) setConnected(false);
        console.error("SignalR connection faield", e);
      });

    networkHub.on("finishedTraining", (res) => {
      setTrainingResults(res);
      setCurrentIteration(undefined);
    });

    networkHub.on("iterationsBreak", (itr, MSEs) => {
      setMseChartData(
        MSEs.map((mse: number, idx: number) => ({ x: idx + 1, mse })),
      );
      setCurrentIteration(itr);
    });

    return () => {
      mounted = false;

      networkHub
        ?.stop()
        .catch((e) => console.error("SignalR disconnecting failed", e));

      if (!networkHub) return;

      networkHub.off("finishedTraining");
      networkHub.off("iterationsBreak");
      networkHub.stop().then().catch(console.error);
      networkHub = undefined;
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-[1fr_200px]">
      <div className="p-4 w-full h-full grid grid-rows-[1fr_1fr] gap-2">
        <PredictionsChart data={trainingResults} />
        <MseChart data={mseChartData} />
      </div>

      <ControlPanel
        connectedToServer={connected}
        currentIteration={currentIteration}
        networkHub={networkHub}
      />

      {!connected && (
        <div className="bg-green-800 text-white fixed bottom-0 left-0 w-full text-center p-1">
          <div className="text-gray-300 text-xs">Connecting to server</div>
        </div>
      )}
    </div>
  );
}
