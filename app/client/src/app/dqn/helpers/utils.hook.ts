import { ChangeEventHandler, useEffect, useRef, useState } from "react";
import getDQNHub, { DQNHub } from "@/signalr/dqn.hub";
import Player from "./player";
import { GameResults } from "@/signalr/qlearning.hub.types";
import TrainingStatus from "@/types/training-status.enum";

const defaultForm = {
  alpha: "0.1",
  lambda: "0.5",
  iterations: "10000",
  createNewThetas: true,
  layers: "2,6,4",
};

export default function useUtils() {
  const hub = useRef<DQNHub>(undefined);
  const player = useRef(new Player());
  const lastUsedIterations = useRef(1);
  const [isConnected, setIsConnected] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState(TrainingStatus.NotStarted);
  const [trainingCompletion, setTrainingCompletion] = useState("");
  const [games, setGames] = useState<GameResults[]>([]);
  const [currentGame, setCurrentGame] = useState(-1);
  const [bestGame, setBestGame] = useState<GameResults | undefined>(undefined);
  const [isGamePlaying, setIsGamePlaying] = useState(false);

  const onGameFinished = (results: GameResults) => {
    const completion =
      ((results.iteration + 1) / lastUsedIterations.current) * 100;
    setTrainingCompletion(` ${completion.toFixed(2)}%`);
    player.current.addGame(results.actions);
    setGames((prev) => [...prev, results]);
    setIsGamePlaying(true);
  };

  const onTrainingFinished = (bestGame: GameResults) => {
    player.current.addBestGame(bestGame.actions);
    setBestGame(bestGame);
    setStatus(TrainingStatus.Finished);
  };

  useEffect(() => {
    let mounted = true;

    const _hub = getDQNHub();
    hub.current = _hub;

    _hub.connection.start().then(() => mounted && setIsConnected(true));
    _hub.connection.onreconnected(() => mounted && setIsConnected(true));
    _hub.connection.onreconnecting(() => mounted && setIsConnected(false));
    _hub.connection.onclose(() => mounted && setIsConnected(false));

    _hub.on("GameFinished", onGameFinished);
    _hub.on("TrainingStopped", () => setStatus(TrainingStatus.Stopped));
    _hub.on("TrainingFinished", onTrainingFinished);

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
    setBestGame(undefined);
    setGames([]);
    const iterations = Number.parseInt(form.iterations);
    hub.current.invoke("StartTraining", {
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

  const onGamePauseResume = () => {
    if (isGamePlaying) {
      player.current.pause();
      setIsGamePlaying(false);
    } else {
      player.current.resume();
      setIsGamePlaying(true);
    }
  };

  const playGameFrom = (gameIdx: number) => {
    setIsGamePlaying(true);
    player.current.playFrom(gameIdx);
  };

  const playBestGame = () => {
    setIsGamePlaying(true);
    player.current.playBestGame();
  };

  return {
    playGameFrom,
    playBestGame,
    onGamePauseResume,
    onStopClick,
    onFieldChange,
    onTrainClick,
    currentGame,
    games,
    trainingCompletion,
    status,
    isConnected,
    form,
    bestGame,
    isGamePlaying,
  };
}
