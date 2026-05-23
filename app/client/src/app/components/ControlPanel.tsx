import { useEffect, useState } from "react";
import { Button, Checkbox, TextField } from "./Fields";
import TrainingStatus from "../types/trainin-status.enum";
import networkHub from "../signalr/network.hub";

type ControlPanelProps = {
  connectedToServer?: boolean;
  currentIteration?: number;
};

const defaultForm = {
  alpha: "0.01",
  iterations: "10000",
  useNewThetas: true,
  layers: "1,2,1",
};

const mapTrainingStatusToText: Record<TrainingStatus, string> = {
  [TrainingStatus.NotStarted]: "Click start to begin training.",
  [TrainingStatus.InProgress]: "Training in progress...",
  [TrainingStatus.Finished]: "Training finished!",
  [TrainingStatus.RequestedToStop]: "Requested to stop training...",
  [TrainingStatus.RequestToStopFulfilled]: "Training stopped.",
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

  useEffect(() => {
    networkHub.on("TrainingStopped", () => {
      setTrainingStatus(TrainingStatus.RequestToStopFulfilled);
    });

    networkHub.on("TrainingFinished", () => {
      setTrainingStatus(TrainingStatus.Finished);
      setForm((prev) => ({ ...prev, useNewThetas: false }));
    });

    return () => {
      networkHub.off("TrainingStopped");
      networkHub.off("TrainingFinished");
    };
  }, []);

  const onStartClick = async () => {
    const iterations = Number.parseInt(form.iterations);
    await networkHub.invoke("Train", {
      layers: form.layers.split(",").map(Number),
      newThetas: form.useNewThetas,
      alpha: Number.parseFloat(form.alpha),
      iterations,
    });
    setTrainingStatus(TrainingStatus.InProgress);
    setIteraionsCount(iterations);
  };

  const onStopClick = async () => {
    await networkHub.invoke("StopTraining");
    setTrainingStatus(TrainingStatus.RequestedToStop);
  };

  const showStartBtn =
    trainingStatus === TrainingStatus.Finished ||
    trainingStatus === TrainingStatus.NotStarted ||
    trainingStatus === TrainingStatus.RequestToStopFulfilled;
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
      <div>{mapTrainingStatusToText[trainingStatus]}</div>
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
