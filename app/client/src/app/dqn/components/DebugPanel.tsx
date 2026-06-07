import { GameResults } from "@/signalr/dqn.hub.types";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import player from "../helpers/player";

type DebugPieceProps = { states: number[] };

type DebugPanelProps = {
  show: boolean;
  games: GameResults[];
  bestGame?: GameResults;
};

const DebugPiece = (props: DebugPieceProps) => (
  <div className="flex gap-4">
    <span className="text-[#0fe71d]">
      ({props.states[0]}, {props.states[1]})
    </span>
    <span className="text-[#e71d1d]">
      ({props.states[2]}, {props.states[3]})
    </span>
  </div>
);

export default function DebugPanel(props: Readonly<DebugPanelProps>) {
  const [currentGame, setCurrentGame] = useState(-1);

  useEffect(() => {
    player.on("gameChange", setCurrentGame);

    return () => {
      player.off("gameChange", setCurrentGame);
    };
  }, []);

  return (
    <div
      className={twMerge(
        "custom-scroll overflow-y-auto overflow-x-hidden max-h-full p-2 text-md hidden",
        props.show && "block",
      )}
    >
      {props.games[currentGame]?.states.map((s, i) => (
        <DebugPiece states={s} key={i} /> //NOSONAR
      ))}
      {currentGame === props.games.length &&
        props.bestGame?.states.map((s, i) => (
          <DebugPiece states={s} key={i} /> //NOSONAR
        ))}
    </div>
  );
}
