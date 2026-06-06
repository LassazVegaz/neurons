import { useEffect, useState } from "react";
import GameButton from "./GameButton";
import { GameResults } from "@/signalr/dqn.hub.types";
import { twMerge } from "tailwind-merge";
import player from "../helpers/player";

type BottomSectionProps = {
  games: GameResults[];
  bestGame?: GameResults;
};

export default function BottomSection(props: Readonly<BottomSectionProps>) {
  const [currentGame, setCurrentGame] = useState(-1);
  const [isGamePlaying, setIsGamePlaying] = useState(false);

  const playBestGame = () => {
    setIsGamePlaying(true);
    player.playBestGame();
  };

  const onGamePauseResume = () => {
    if (isGamePlaying) {
      player.pause();
      setIsGamePlaying(false);
    } else {
      player.resume();
      setIsGamePlaying(true);
    }
  };

  const playGameFrom = (gameIdx: number) => {
    setIsGamePlaying(true);
    player.playFrom(gameIdx);
  };

  useEffect(() => {
    player.onGameChange = setCurrentGame;

    return () => {
      player.onGameChange = undefined;
    };
  }, []);

  return (
    <div className="bg-blue-950 col-span-2 flex flex-col justify-center gap-4 py-4 min-h-20">
      <div className="flex justify-center items-center gap-4">
        {props.games.map((g, idx) => (
          <GameButton
            key={g.iteration}
            isPlayingNow={idx === currentGame}
            label={g.iteration}
            rewards={g.totalRewards}
            onClick={() => playGameFrom(idx)}
          />
        ))}

        {props.bestGame && (
          <GameButton
            isPlayingNow={currentGame === props.games.length}
            label="Best"
            rewards={props.bestGame.totalRewards}
            onClick={playBestGame}
            className={twMerge(
              "bg-red-900",
              currentGame === props.games.length && "bg-red-950",
            )}
          />
        )}
      </div>

      {props.games.length > 0 && (
        <div className="flex justify-center">
          <button
            className="border border-blue-600 py-2 px-4 rounded cursor-pointer"
            onClick={onGamePauseResume}
          >
            {isGamePlaying ? "Pause" : "Resume"}
          </button>
        </div>
      )}
    </div>
  );
}
