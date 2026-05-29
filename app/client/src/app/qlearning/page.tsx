"use client";
import ControlPanelContainer from "@/components/ControlPanelContainer";
import { Button, Checkbox, TextField } from "@/components/Fields";
import trainingStatusText from "@/constants/training-status-text.constant";
import TrainingStatus from "@/types/training-status.enum";
import { twMerge } from "tailwind-merge";
import useUtils from "./helpers/utils";

const boxes = [] as number[];
for (let i = 0; i < 100; i++) boxes.push(i);

export default function QLearningPage() {
  const utils = useUtils();

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
            checked={utils.form.createNewTable}
            label="New table"
            name="createNewTable"
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

        <div className="bg-blue-950 col-span-2 flex justify-center items-center gap-4">
          {utils.games.map((g, idx) => (
            <div
              key={g.iteration}
              className={twMerge(
                "border border-blue-400 flex flex-col gap-1 justify-center items-center w-20 py-2 rounded cursor-pointer duration-300 hover:border-blue-700",
                utils.currentGame === idx && "bg-gray-950",
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
          utils.isConnected && "hidden",
        )}
      >
        connecting...
      </div>
    </>
  );
}
