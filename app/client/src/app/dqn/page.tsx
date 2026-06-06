"use client";
import ConnectionDisplay from "@/components/ConnectionDisplay";
import ControlPanel from "./components/ControlPanel";
import BottomSection from "./components/BottomSection";
import { useEffect, useState } from "react";
import { GameResults } from "@/signalr/dqn.hub.types";
import getDQNHub from "@/signalr/dqn.hub";
import { HubConnectionState } from "@microsoft/signalr";
import player from "./helpers/player";

const boxes = [] as { id: string }[];
for (let y = 0; y < 10; y++)
  for (let x = 0; x < 10; x++) boxes.push({ id: `box-${x}-${y}` });

const connectToHub = () => {
  const _hub = getDQNHub();

  if (_hub.connection.state !== HubConnectionState.Disconnected) return;

  return new Promise<void>((resolve) => {
    _hub.connection
      .start()
      .then(resolve)
      .catch((e) => console.log("Connection error: ", e));
    // Sometimes I turn off backend for testing so above connection error happens frequently
    // if I console.error it, next.js shows red error overlay which is annoying, so I just log it
  });
};

export default function DQNPage() {
  const [games, setGames] = useState<GameResults[]>([]);
  const [bestGame, setBestGame] = useState<GameResults | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);

  const onGameAdded = (game: GameResults) => {
    setGames((prev) => [...prev, game]);
  };

  const onBestGameUpdated = (bestGame: GameResults) => {
    setBestGame(bestGame);
    player.addBestGame(bestGame);
  };

  const onGameReset = () => {
    setGames([]);
    setBestGame(undefined);
    player.reset();
  };

  useEffect(() => {
    let mounted = true;
    const _hub = getDQNHub();

    connectToHub()?.then(() => {
      if (mounted) setIsConnected(true);
    });

    _hub.connection.onreconnected(() => mounted && setIsConnected(true));
    _hub.connection.onreconnecting(() => mounted && setIsConnected(false));
    _hub.connection.onclose(() => mounted && setIsConnected(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <div className="q-learning h-full grid grid-cols-[1fr_300px] grid-rows-[1fr_auto]">
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-10 gap-1">
            {boxes.map((b) => (
              <div
                key={b.id}
                id={b.id}
                className="h-11 w-11 border border-blue-300 rounded flex items-center justify-center text-gray-400"
              ></div>
            ))}
          </div>
        </div>

        <ControlPanel
          onGameAdded={onGameAdded}
          onBestGameUpdated={onBestGameUpdated}
          onGameReset={onGameReset}
        />

        <BottomSection games={games} bestGame={bestGame} />
      </div>

      <ConnectionDisplay hide={isConnected} />
    </>
  );
}
