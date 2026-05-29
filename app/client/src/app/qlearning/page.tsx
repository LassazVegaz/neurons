"use client";
import ControlPanelContainer from "@/components/ControlPanelContainer";
import { Button, Checkbox, TextField } from "@/components/Fields";
import trainingStatusText from "@/constants/training-status-text.constant";
import getQLearningHub, { QLearningHub } from "@/signalr/qlearning.hub";
import { GameResults } from "@/signalr/qlearning.hub.types";
import TrainingStatus from "@/types/training-status.enum";
import { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Player from "./helpers/player";

const boxes = [] as number[];
for (let i = 0; i < 100; i++) boxes.push(i);

const defaultForm = {
  alpha: "0.1",
  lambda: "0.1",
  iterations: "10000",
  createNewTable: true,
};

const totalGameResults = Number.parseInt(
  process.env.NEXT_PUBLIC_TOTAL_GAME_RESULTS_TO_RECIEVE!,
);

export default function QLearningPage() {
  const hub = useRef<QLearningHub>(null);
  const player = useRef(new Player());
  const [isConnected, setIsConnected] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState(TrainingStatus.NotStarted);
  const [trainingCompletion, setTrainingCompletion] = useState("");
  const [games, setGames] = useState<GameResults[]>([]);
  const [currentGame, setCurrentGame] = useState(-1);

  const onGameFinished = (results: GameResults) => {
    const completion = ((results.iteration + 1) / totalGameResults) * 100;
    setTrainingCompletion(` ${completion.toFixed(2)}%`);
    player.current.addGame(results.actions);
    setGames((prev) => [...prev, results]);
  };

  useEffect(() => {
    let mounted = true;

    const _hub = getQLearningHub();
    hub.current = _hub;

    _hub.connection.start().then(() => mounted && setIsConnected(true));
    _hub.connection.onreconnected(() => mounted && setIsConnected(true));
    _hub.connection.onreconnecting(() => mounted && setIsConnected(false));
    _hub.connection.onclose(() => mounted && setIsConnected(false));

    _hub.on("GameFinished", onGameFinished);
    _hub.on("TrainingStopped", () => setStatus(TrainingStatus.Stopped));
    _hub.on("TrainingFinished", () => setStatus(TrainingStatus.Finished));

    const _player = player.current;
    _player.onGameChange = setCurrentGame;

    return () => {
      mounted = false;
      _hub.off("GameFinished");
      _hub.off("TrainingStopped");
      _hub.off("TrainingFinished");
      _player.reset();
    };
  }, []);

  const onTrainClick = () => {
    if (!hub.current) return;

    player.current.reset();
    hub.current.invoke("Train", {
      alpha: Number.parseFloat(form.alpha),
      lambda: Number.parseFloat(form.lambda),
      iterations: Number.parseInt(form.iterations),
      createNewTable: form.createNewTable,
    });
    setStatus(TrainingStatus.InProgress);
    setForm((prev) => ({ ...prev, createNewTable: false }));
  };

  const onStopClick = () => {
    if (!hub.current) return;
    hub.current.invoke("StopTraining");
    setStatus(TrainingStatus.RequestedToStop);
  };

  const onFieldChange: ChangeEventHandler<
    HTMLInputElement,
    HTMLInputElement
  > = (e) => {
    const prevValue = form[e.target.name as keyof typeof form];
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        typeof prevValue === "boolean" ? e.target.checked : e.target.value,
    }));
  };

  return (
    <>
      <div className="h-full grid grid-cols-[1fr_300px] grid-rows-[1fr_150px]">
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-10 gap-1">
            {boxes.map((i) => (
              <div
                key={i}
                className="h-10 w-10 border border-blue-300 rounded"
              />
            ))}
          </div>
        </div>
        <ControlPanelContainer className="border-l border-blue-400">
          <Checkbox
            checked={form.createNewTable}
            label="New table"
            name="createNewTable"
            onChange={onFieldChange}
          />
          <TextField
            label="Iterations"
            name="iterations"
            value={form.iterations}
            onChange={onFieldChange}
          />
          <TextField
            label="Alpha"
            name="alpha"
            value={form.alpha}
            onChange={onFieldChange}
          />
          <TextField
            label="Lambda"
            name="lambda"
            value={form.lambda}
            onChange={onFieldChange}
          />

          <div className="h-10" />

          {(status === TrainingStatus.Finished ||
            status === TrainingStatus.NotStarted ||
            status === TrainingStatus.Stopped) && (
            <Button className="border border-blue-600" onClick={onTrainClick}>
              Train
            </Button>
          )}
          {status === TrainingStatus.InProgress && (
            <Button className="border border-red-600" onClick={onStopClick}>
              Stop
            </Button>
          )}

          <div>
            Status: {trainingStatusText[status]}
            {status === TrainingStatus.InProgress && trainingCompletion}
          </div>
        </ControlPanelContainer>

        <div className="bg-blue-950 col-span-2 flex justify-center items-center gap-4">
          {games.map((g, idx) => (
            <div
              key={g.iteration}
              className={twMerge(
                "border border-blue-400 flex flex-col gap-1 justify-center items-center w-20 py-2 rounded cursor-pointer duration-300 hover:border-blue-700",
                currentGame === idx && "bg-gray-950",
              )}
            >
              <div className="text-blue-300 text-sm">{g.iteration}</div>
              <div>{g.totalRewards}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={twMerge(
          "absolute bottom-0 left-0 right-0",
          isConnected && "hidden",
        )}
      >
        connecting...
      </div>
    </>
  );
}
