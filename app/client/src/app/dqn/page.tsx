"use client";
import ConnectionDisplay from "@/components/ConnectionDisplay";
import ControlPanelContainer from "@/components/ControlPanelContainer";
import { Checkbox, TextField, Button } from "@/components/Fields";
import trainingStatusText from "@/constants/training-status-text.constant";
import TrainingStatus from "@/types/training-status.enum";
import useUtils from "./helpers/utils.hook";
import GameButton from "./components/GameButton";
import { twMerge } from "tailwind-merge";

const boxes = [] as { id: string }[];
for (let y = 0; y < 10; y++)
  for (let x = 0; x < 10; x++) boxes.push({ id: `box-${y}-${x}` });

export default function DQNPage() {
  const utils = useUtils();

  return (
    <>
      <div className="q-learning h-full grid grid-cols-[1fr_300px] grid-rows-[1fr_auto]">
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-10 gap-1">
            {boxes.map((b) => (
              <div
                key={b.id}
                id={b.id}
                className="h-11 w-11 border border-blue-300 rounded flex items-center justify-center text-gray-400"
              ></div>
            ))}
          </div>
        </div>

        <ControlPanelContainer className="border-l border-blue-400">
          <Checkbox
            checked={utils.autoPlay}
            label="Auto Play"
            onChange={utils.onAutoPlayChange}
          />
          <Checkbox
            checked={utils.form.noGreedy}
            label="No Greedy"
            name="noGreedy"
            onChange={utils.onFieldChange}
          />
          <Checkbox
            checked={utils.form.createNewThetas}
            label="New table"
            name="createNewThetas"
            onChange={utils.onFieldChange}
          />
          <TextField
            label="Iterations"
            name="iterations"
            value={utils.form.iterations}
            onChange={utils.onFieldChange}
          />
          <TextField
            label="Alpha"
            name="alpha"
            value={utils.form.alpha}
            onChange={utils.onFieldChange}
          />
          <TextField
            label="Lambda"
            name="lambda"
            value={utils.form.lambda}
            onChange={utils.onFieldChange}
          />
          <TextField
            label="Layers"
            name="layers"
            value={utils.form.layers}
            onChange={utils.onFieldChange}
          />

          <div className="h-10" />

          {(utils.status === TrainingStatus.Finished ||
            utils.status === TrainingStatus.NotStarted ||
            utils.status === TrainingStatus.Stopped) && (
            <Button
              className="border border-blue-600"
              onClick={utils.onTrainClick}
            >
              Train
            </Button>
          )}
          {utils.status === TrainingStatus.InProgress && (
            <Button
              className="border border-red-600"
              onClick={utils.onStopClick}
            >
              Stop
            </Button>
          )}

          <div>
            Status: {trainingStatusText[utils.status]}
            {utils.status === TrainingStatus.InProgress &&
              utils.trainingCompletion}
          </div>
        </ControlPanelContainer>

        <div className="bg-blue-950 col-span-2 flex flex-col justify-center gap-4 py-4 min-h-20">
          <div className="flex justify-center items-center gap-4">
            {utils.games.map((g, idx) => (
              <GameButton
                key={g.iteration}
                isPlayingNow={idx === utils.currentGame}
                label={g.iteration}
                rewards={g.totalRewards}
                onClick={() => utils.playGameFrom(idx)}
              />
            ))}

            {utils.bestGame && (
              <GameButton
                isPlayingNow={utils.currentGame === utils.games.length}
                label="Best"
                rewards={utils.bestGame.totalRewards}
                onClick={utils.playBestGame}
                className={twMerge(
                  "bg-red-900",
                  utils.currentGame === utils.games.length && "bg-red-950",
                )}
              />
            )}
          </div>

          {utils.games.length > 0 && (
            <div className="flex justify-center">
              <button
                className="border border-blue-600 py-2 px-4 rounded cursor-pointer"
                onClick={utils.onGamePauseResume}
              >
                {utils.isGamePlaying ? "Pause" : "Resume"}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConnectionDisplay hide />
    </>
  );
}
