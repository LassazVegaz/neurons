"use client";
import { useEffect, useState } from "react";
import { TrainingResult } from "@/signalr/network.hub.types";
import ControlPanel from "./components/ControlPanel";
import { MseChart, MseChartProps, PredictionsChart } from "./components/Charts";
import getNetworkHub, { NetworkHub } from "@/signalr/network.hub";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [trainingResults, setTrainingResults] = useState<TrainingResult[]>([]);
  const [mseChartData, setMseChartData] = useState<MseChartProps["data"]>([]);
  const [currentIteration, setCurrentIteration] = useState<number | undefined>(
    undefined,
  );
  const [networkHub, setNetworkHub] = useState<NetworkHub | undefined>();
  const [showActualLine, setShowActualLine] = useState(true);

  useEffect(() => {
    let mounted = true;

    const networkHub = getNetworkHub();

    networkHub.connection
      .start()
      .then(() => {
        if (!mounted) return;
        setConnected(true);
        setNetworkHub(networkHub);
      })
      .catch((e) => {
        if (mounted) setConnected(false);
        console.error("SignalR connection faield", e);
      });

    networkHub.connection.onclose(() => mounted && setConnected(false));
    networkHub.connection.onreconnecting(() => mounted && setConnected(false));
    networkHub.connection.onreconnected(() => mounted && setConnected(true));

    networkHub.on("TrainingFinished", (res) => {
      setTrainingResults(res);
      setCurrentIteration(undefined);
    });

    networkHub.on("IterationBreak", (itr, MSEs) => {
      setMseChartData(
        MSEs.map((mse: number, idx: number) => ({ x: idx + 1, mse })),
      );
      setCurrentIteration(itr);
    });

    return () => {
      mounted = false;

      if (!networkHub) return;

      networkHub.off("TrainingFinished");
      networkHub.off("IterationBreak");
      networkHub.connection.stop().then().catch(console.error);
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-[1fr_200px]">
      <div className="p-4 w-full h-full grid grid-rows-[1fr_1fr] gap-2">
        <PredictionsChart
          data={trainingResults}
          showActualLine={showActualLine}
        />
        <MseChart data={mseChartData} />
      </div>

      <ControlPanel
        connectedToServer={connected}
        currentIteration={currentIteration}
        networkHub={networkHub}
        showActualLine={showActualLine}
        onShowActualLineChange={(v) => setShowActualLine(v)}
      />

      {!connected && (
        <div className="bg-green-800 text-white fixed bottom-0 left-0 w-full text-center p-1">
          <div className="text-gray-300 text-xs">Connecting to server</div>
        </div>
      )}
    </div>
  );
}
