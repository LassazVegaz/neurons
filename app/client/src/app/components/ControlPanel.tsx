import { useState } from "react";
import { Checkbox, TextField } from "./Fields";
import TrainingStatus from "../types/trainin-status.enum";
import Socket from "@/types/socket.type";

type ControlPanelProps = {
  trainingStatus: TrainingStatus;
  socket?: Socket;
  onTrainingStart?: () => void;
};

export default function ControlPanel(props: Readonly<ControlPanelProps>) {
  const [form, setForm] = useState({
    alpha: "0.01",
    iterations: "10000",
    useNewThetas: true,
    layers: "1,2,1",
  });

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
      <div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            props.socket?.emit("train", {
              layers: form.layers.split(",").map(Number),
              newThetas: form.useNewThetas,
              alpha: Number.parseFloat(form.alpha),
              iterations: Number.parseInt(form.iterations),
            });
            props.onTrainingStart?.();
          }}
        >
          Start
        </button>
      </div>
      <div>
        {props.trainingStatus === TrainingStatus.NotStarted &&
          "Click start to begin training."}
        {props.trainingStatus === TrainingStatus.InProgress &&
          "Training in progress..."}
        {props.trainingStatus === TrainingStatus.Finished &&
          "Training finished!"}
      </div>
    </div>
  );
}
