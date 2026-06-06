import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ControlPanelContainer from "@/components/ControlPanelContainer";
import { TextField, Button, FieldContainer } from "@/components/Fields";
import trainingStatusText from "@/constants/training-status-text.constant";
import TrainingStatus from "@/types/training-status.enum";
import player, { DEFAULT_SPEED } from "../helpers/player";
import getDQNHub, { DQNHub } from "@/signalr/dqn.hub";
import { GameResults, LastUsedParams } from "@/signalr/dqn.hub.types";

type ControlPanelProps = {
  lastUsedParams?: LastUsedParams;
  onGameAdded: (game: GameResults) => void;
  onBestGameUpdated: (game: GameResults) => void;
  onAllGamesReset: () => void;
};

const defaultForm = {
  alpha: "0.1",
  lambda: "0.5",
  iterations: "10000",
  createNewThetas: true,
  layers: "2,6,4",
  noGreedy: false,
  speed: DEFAULT_SPEED.toString(),
  autoPlay: true,
};

const buildForm = (lastUsedParams?: LastUsedParams) => {
  if (!lastUsedParams) return defaultForm;
  return {
    alpha: lastUsedParams.alpha.toString(),
    lambda: lastUsedParams.lambda.toString(),
    iterations: lastUsedParams.iterations.toString(),
    layers: lastUsedParams.layers.join(","),
    noGreedy: lastUsedParams.noGreedy,
    createNewThetas: false,
    speed: player.speed.toString(),
    autoPlay: player.autoPlay,
  };
};

export default function ControlPanel(props: Readonly<ControlPanelProps>) {
  const hub = useRef<DQNHub>(undefined);
  const lastUsedIterations = useRef(1);
  const [form, setForm] = useState(() => buildForm(props.lastUsedParams));
  const [status, setStatus] = useState(TrainingStatus.NotStarted);
  const [trainingCompletion, setTrainingCompletion] = useState("");

  // Train and Best Game buttons
  const showStartButtons =
    status === TrainingStatus.Finished ||
    status === TrainingStatus.NotStarted ||
    status === TrainingStatus.Stopped;

  const onFieldChange: ChangeEventHandler<
    HTMLInputElement,
    HTMLInputElement
  > = (e) => {
    setForm((prev) => {
      const prevValue = prev[e.target.name as keyof typeof form];
      return {
        ...prev,
        [e.target.name]:
          typeof prevValue === "boolean" ? e.target.checked : e.target.value,
      };
    });
  };

  const onChangeSpeedButtonCLick = () => {
    const newSpeed = Number.parseInt(form.speed);
    player.speed = newSpeed;
  };

  const onBestGameButtonClick = async () => {
    if (!hub.current) return;
    const bestGame = await hub.current.invoke("GetTheBestGame");
    if (bestGame) {
      props.onBestGameUpdated(bestGame);
    } else {
      alert("No best game found");
    }
  };

  const onTrainButtonClick = () => {
    if (!hub.current) return;

    props.onAllGamesReset();
    const iterations = Number.parseInt(form.iterations);
    hub.current.send("StartTraining", {
      alpha: Number.parseFloat(form.alpha),
      lambda: Number.parseFloat(form.lambda),
      iterations: iterations,
      createNewThetas: form.createNewThetas,
      layers: form.layers.split(",").map((s) => Number.parseInt(s.trim())),
    });
    setStatus(TrainingStatus.InProgress);
    setForm((prev) => ({ ...prev, createNewThetas: false }));
    lastUsedIterations.current = iterations;
  };

  const onStopClick = () => {
    if (!hub.current) return;
    hub.current.send("StopTraining");
    setStatus(TrainingStatus.RequestedToStop);
  };

  const onGameFinished = useCallback(
    (results: GameResults) => {
      const completion =
        ((results.iteration + 1) / lastUsedIterations.current) * 100;
      setTrainingCompletion(` ${completion.toFixed(2)}%`);
      props.onGameAdded(results);
    },
    [props],
  );

  useEffect(() => {
    const _hub = getDQNHub();
    hub.current = _hub;

    _hub.on("GameFinished", onGameFinished);

    return () => {
      _hub.off("GameFinished", onGameFinished);
    };
  }, [onGameFinished]);

  return (
    <ControlPanelContainer className="border-l border-blue-400">
      <Checkbox
        checked={form.autoPlay}
        label="Auto Play"
        onChange={onFieldChange}
      />
      <Checkbox
        checked={form.noGreedy}
        label="No Greedy"
        name="noGreedy"
        onChange={onFieldChange}
      />
      <Checkbox
        checked={form.createNewThetas}
        label="New table"
        name="createNewThetas"
        onChange={onFieldChange}
      />
      <CustomTextField
        label="Iterations"
        name="iterations"
        value={form.iterations}
        onChange={onFieldChange}
      />
      <CustomTextField
        label="Alpha"
        name="alpha"
        value={form.alpha}
        onChange={onFieldChange}
      />
      <CustomTextField
        label="Lambda"
        name="lambda"
        value={form.lambda}
        onChange={onFieldChange}
      />
      <CustomTextField
        label="Layers"
        name="layers"
        value={form.layers}
        onChange={onFieldChange}
      />

      <FieldContainer>
        <label htmlFor="speed">Speed</label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <TextField name="speed" value={form.speed} onChange={onFieldChange} />
          <button
            className="border p-1 px-3 rounded border-blue-600 cursor-pointer"
            onClick={onChangeSpeedButtonCLick}
          >
            Set
          </button>
        </div>
      </FieldContainer>

      <div className="h-10" />

      {showStartButtons && (
        <>
          <Button
            className="border border-blue-600"
            onClick={onTrainButtonClick}
          >
            Train
          </Button>
          <Button
            className="border border-purple-600"
            onClick={onBestGameButtonClick}
          >
            Best Game
          </Button>
        </>
      )}
      {status === TrainingStatus.InProgress && (
        <Button className="border border-red-600" onClick={onStopClick}>
          Stop
        </Button>
      )}

      <TrainingStatusDisplay
        status={status}
        trainingCompletion={trainingCompletion}
      />
    </ControlPanelContainer>
  );
}

//#region COMPONENTS
type CustomTextFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: React.ComponentProps<"input">["onChange"];
};

export const CustomTextField = (props: CustomTextFieldProps) => (
  <FieldContainer>
    <label htmlFor={props.name}>{props.label}</label>
    <TextField
      name={props.name}
      value={props.value}
      onChange={props.onChange}
    />
  </FieldContainer>
);

type CheckboxProps = {
  label: string;
  name?: string;
  checked: boolean;
  onChange: React.ComponentProps<"input">["onChange"];
};

export const Checkbox = (props: CheckboxProps) => (
  <FieldContainer className="flex-row items-center gap-2">
    <input
      name={props.name}
      type="checkbox"
      checked={props.checked}
      onChange={props.onChange}
    />
    <label htmlFor={props.name}>{props.label}</label>
  </FieldContainer>
);

type TrainingStatusDisplayProps = {
  status: TrainingStatus;
  trainingCompletion: string;
};

export const TrainingStatusDisplay = (props: TrainingStatusDisplayProps) => (
  <div>
    Status: {trainingStatusText[props.status]}
    {props.status === TrainingStatus.InProgress && props.trainingCompletion}
  </div>
);
//#endregion
