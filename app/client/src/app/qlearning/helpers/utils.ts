import { useRef, useState, useEffect, ChangeEventHandler } from "react";
import getQLearningHub, { QLearningHub } from "@/signalr/qlearning.hub";
import { GameResults } from "@/signalr/qlearning.hub.types";
import TrainingStatus from "@/types/training-status.enum";
import Player from "./player";

const defaultForm = {
  alpha: "0.1",
  lambda: "0.1",
  iterations: "10000",
  createNewTable: true,
};

const totalGameResults = Number.parseInt(
  process.env.NEXT_PUBLIC_TOTAL_GAME_RESULTS_TO_RECIEVE!,
);

export default function useUtils() {
  const hub = useRef<QLearningHub>(null);
  const player = useRef(new Player());
  const [isConnected, setIsConnected] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState(TrainingStatus.NotStarted);
  const [trainingCompletion, setTrainingCompletion] = useState("");
  const [games, setGames] = useState<GameResults[]>([]);
  const [currentGame, setCurrentGame] = useState(-1);
  const [winner, setWinner] = useState<number | undefined>(undefined);

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
    _player.OnWinnerFound = setWinner;

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
    setGames([]);
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

  return {
    onStopClick,
    onFieldChange,
    onTrainClick,
    currentGame,
    games,
    trainingCompletion,
    status,
    isConnected,
    form,
    winner,
  };
}
