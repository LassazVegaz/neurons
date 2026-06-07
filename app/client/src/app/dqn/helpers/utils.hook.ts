import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import getDQNHub, { DQNHub } from "@/signalr/dqn.hub";
import _player, { DEFAULT_SPEED } from "./player";
import TrainingStatus from "@/types/training-status.enum";
import { GameResults } from "@/signalr/dqn.hub.types";
import { HubConnectionState } from "@microsoft/signalr";

const defaultForm = {
  alpha: "0.1",
  lambda: "0.5",
  iterations: "10000",
  createNewThetas: true,
  layers: "2,6,4",
  noGreedy: false,
  speed: DEFAULT_SPEED.toString(),
};

export default function useUtils() {
  const hub = useRef<DQNHub>(undefined);
  const player = useRef(_player);
  const lastUsedIterations = useRef(1);
  const [isConnected, setIsConnected] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState(TrainingStatus.NotStarted);
  const [trainingCompletion, setTrainingCompletion] = useState("");
  const [games, setGames] = useState<GameResults[]>([]);
  const [currentGame, setCurrentGame] = useState(-1);
  const [bestGame, setBestGame] = useState<GameResults | undefined>(undefined);
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const onGameFinished = useCallback(
    (results: GameResults) => {
      const completion =
        ((results.iteration + 1) / lastUsedIterations.current) * 100;
      setTrainingCompletion(` ${completion.toFixed(2)}%`);
      player.current.addGame(results);
      setGames((prev) => [...prev, results]);
      if (autoPlay) setIsGamePlaying(true);
    },
    [autoPlay],
  );

  const onTrainingFinished = (bestGame: GameResults) => {
    player.current.addBestGame(bestGame);
    setBestGame(bestGame);
    setStatus(TrainingStatus.Finished);
  };

  useEffect(() => {
    let mounted = true;

    const _hub = getDQNHub();
    hub.current = _hub;

    if (_hub.connection.state === HubConnectionState.Disconnected) {
      _hub.connection
        .start()
        .then(() => {
          if (mounted) setIsConnected(true);

          _hub.invoke("GetLastUsedParams").then((p) => {
            if (!p || !mounted) return;
            setForm((prev) => ({
              alpha: p.alpha.toString(),
              createNewThetas: false,
              iterations: p.iterations.toString(),
              lambda: p.lambda.toString(),
              layers: p.layers.join(","),
              noGreedy: p.noGreedy,
              speed: prev.speed,
            }));
          });
        })
        .catch((e) => console.log("Connection error: ", e));
      // Sometimes I turn off backend for testing so above connection error happens frequently
      // if I console.error it, next.js shows red error overlay which is annoying, so I just log it
    }

    _hub.connection.onreconnected(() => mounted && setIsConnected(true));
    _hub.connection.onreconnecting(() => mounted && setIsConnected(false));
    _hub.connection.onclose(() => mounted && setIsConnected(false));

    _hub.on("TrainingStopped", () => setStatus(TrainingStatus.Stopped));
    _hub.on("TrainingFinished", onTrainingFinished);

    const _player = player.current;
    _player.onGameChange = setCurrentGame;
    _player.onPlayingFinished = () => setIsGamePlaying(false);

    return () => {
      mounted = false;
      _hub.off("TrainingStopped");
      _hub.off("TrainingFinished");
      _player.reset();
      _player.onGameChange = undefined;
      _player.onPlayingFinished = undefined;
    };
  }, []);

  useEffect(() => {
    const _hub = hub.current;
    if (!_hub) return;

    _hub.on("GameFinished", onGameFinished);

    return () => {
      _hub.off("GameFinished");
    };
  }, [onGameFinished]);

  const onTrainClick = () => {
    if (!hub.current) return;

    player.current.reset();
    setBestGame(undefined);
    setGames([]);
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

  const onAutoPlayChange = () => {
    setAutoPlay((prev) => {
      player.current.autoPlay = !prev;
      return player.current.autoPlay;
    });
  };

  const onChangeSpeedButtonCLick = () => {
    const newSpeed = Number.parseInt(form.speed);
    player.current.speed = newSpeed;
  };

  const getTheBestGameClick = async () => {
    if (!hub.current) return;
    const bestGame = await hub.current.invoke("GetTheBestGame");
    if (bestGame) {
      setBestGame(bestGame);
      player.current.addBestGame(bestGame);
      if (autoPlay && !isGamePlaying) setIsGamePlaying(true);
    } else {
      alert("No best game found");
    }
  };

  return {
    getTheBestGameClick,
    onChangeSpeedButtonCLick,
    onAutoPlayChange,
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
    autoPlay,
  };
}
