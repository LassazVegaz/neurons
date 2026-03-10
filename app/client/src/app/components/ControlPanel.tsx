import { useEffect, useState } from "react";
import { Button, Checkbox, TextField } from "./Fields";
import TrainingStatus from "../types/trainin-status.enum";
import Socket from "@/types/socket.type";

type ControlPanelProps = {
  socket?: Socket;
  connectedToServer?: boolean;
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
  const [form, setForm] = useState(defaultForm);
  const [trainingStatus, setTrainingStatus] = useState(
    TrainingStatus.NotStarted,
  );

  useEffect(() => {
    if (!props.socket) return;

    props.socket.on("requestToStopTrainingFulfilled", () => {
      setTrainingStatus(TrainingStatus.RequestToStopFulfilled);
    });

    props.socket.on("finishedTraining", () => {
      setTrainingStatus(TrainingStatus.Finished);
      setForm((prev) => ({ ...prev, useNewThetas: false }));
    });

    return () => {
      if (!props.socket) return;
      props.socket.off("requestToStopTrainingFulfilled");
      props.socket.off("finishedTraining");
    };
  }, [props.socket]);

  const onStartClick = () => {
    if (!props.socket) return;
    props.socket.emit("train", {
      layers: form.layers.split(",").map(Number),
      newThetas: form.useNewThetas,
      alpha: Number.parseFloat(form.alpha),
      iterations: Number.parseInt(form.iterations),
    });
    setTrainingStatus(TrainingStatus.InProgress);
  };

  const onStopClick = () => {
    if (!props.socket) return;
    props.socket.emit("requestToStopTraining");
    setTrainingStatus(TrainingStatus.RequestedToStop);
  };

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
        {(trainingStatus === TrainingStatus.Finished ||
          trainingStatus === TrainingStatus.NotStarted ||
          trainingStatus === TrainingStatus.RequestToStopFulfilled) && (
          <Button
            className="bg-blue-500 hover:bg-blue-700"
            onClick={onStartClick}
            disabled={!props.connectedToServer}
          >
            Start
          </Button>
        )}
        {trainingStatus === TrainingStatus.InProgress && (
          <Button className="bg-red-500 hover:bg-red-700" onClick={onStopClick}>
            Stop
          </Button>
        )}
      </div>
      <div>{mapTrainingStatusToText[trainingStatus]}</div>
    </div>
  );
}
