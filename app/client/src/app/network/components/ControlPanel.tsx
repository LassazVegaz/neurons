import { ChangeEventHandler, useEffect, useState } from "react";
import { NetworkHub } from "@/signalr/network.hub";
import TrainingStatus from "@/types/training-status.enum";
import { Button, Checkbox, TextField } from "@/components/Fields";
import trainingStatusText from "@/constants/training-status-text.constant";

type ControlPanelProps = {
  connectedToServer?: boolean;
  currentIteration?: number;
  networkHub?: NetworkHub;
  showActualLine: boolean;
  onShowActualLineChange?: (v: boolean) => void;
};

const defaultForm = {
  alpha: "0.01",
  iterations: "10000",
  useNewThetas: true,
  layers: "1,2,1",
};

export default function ControlPanel(props: Readonly<ControlPanelProps>) {
  /**
   * Currently training iterations count. If not training, can be `undefined`
   */
  const [iteraionsCount, setIteraionsCount] = useState<number | undefined>(
    undefined,
  );
  const [form, setForm] = useState(defaultForm);
  const [trainingStatus, setTrainingStatus] = useState(
    TrainingStatus.NotStarted,
  );

  const networkHub = props.networkHub;

  useEffect(() => {
    networkHub?.on("TrainingStopped", () => {
      setTrainingStatus(TrainingStatus.Stopped);
    });

    networkHub?.on("TrainingFinished", () => {
      setTrainingStatus(TrainingStatus.Finished);
      setForm((prev) => ({ ...prev, useNewThetas: false }));
    });

    return () => {
      networkHub?.off("TrainingStopped");
      networkHub?.off("TrainingFinished");
    };
  }, [networkHub]);

  const onStartClick = async () => {
    const iterations = Number.parseInt(form.iterations);
    await networkHub?.send("Train", {
      layers: form.layers.split(",").map(Number),
      newThetas: form.useNewThetas,
      alpha: Number.parseFloat(form.alpha),
      iterations,
    });
    setTrainingStatus(TrainingStatus.InProgress);
    setIteraionsCount(iterations);
  };

  const onStopClick = async () => {
    await networkHub?.send("StopTraining");
    setTrainingStatus(TrainingStatus.RequestedToStop);
  };

  const onFieldValueChange: ChangeEventHandler<
    HTMLInputElement,
    HTMLInputElement
  > = (e) => {
    const value = e.target.type === "text" ? e.target.value : e.target.checked;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const showStartBtn =
    trainingStatus === TrainingStatus.Finished ||
    trainingStatus === TrainingStatus.NotStarted ||
    trainingStatus === TrainingStatus.Stopped;
  const showStopBtn = trainingStatus === TrainingStatus.InProgress;

  const isTraining =
    trainingStatus === TrainingStatus.InProgress ||
    trainingStatus === TrainingStatus.RequestedToStop;

  const completionPercentage =
    props.currentIteration && iteraionsCount
      ? ((props.currentIteration / iteraionsCount) * 100).toFixed(2)
      : undefined;

  return (
    <div className="flex flex-col gap-4 pt-4 pr-4">
      <Checkbox
        label="Show actual"
        name="showActual"
        checked={props.showActualLine}
        onChange={(e) => props.onShowActualLineChange?.(e.target.checked)}
      />
      <Checkbox
        label="Use new thetas"
        name="useNewThetas"
        checked={form.useNewThetas}
        onChange={onFieldValueChange}
      />
      <TextField
        label="Alpha (learning rate)"
        name="alpha"
        value={form.alpha}
        onChange={onFieldValueChange}
      />
      <TextField
        label="Iterations"
        name="iterations"
        value={form.iterations}
        onChange={onFieldValueChange}
      />
      <TextField
        label="Layers"
        name="layers"
        value={form.layers}
        onChange={onFieldValueChange}
      />
      <div className="flex gap-4">
        {showStartBtn && (
          <Button
            className="bg-blue-500 hover:bg-blue-700"
            onClick={onStartClick}
            disabled={!props.connectedToServer}
          >
            Start
          </Button>
        )}
        {showStopBtn && (
          <Button className="bg-red-500 hover:bg-red-700" onClick={onStopClick}>
            Stop
          </Button>
        )}
      </div>
      <div>{trainingStatusText[trainingStatus]}</div>
      {isTraining && (
        <div>
          Iteration: {props.currentIteration} of {iteraionsCount}
        </div>
      )}
      {isTraining && completionPercentage && (
        <div>Completion: {completionPercentage}%</div>
      )}
    </div>
  );
}
