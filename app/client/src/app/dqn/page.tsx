"use client";
import ConnectionDisplay from "@/components/ConnectionDisplay";
import ControlPanel from "./components/ControlPanel";
import BottomSection from "./components/BottomSection";

const boxes = [] as { id: string }[];
for (let y = 0; y < 10; y++)
  for (let x = 0; x < 10; x++) boxes.push({ id: `box-${x}-${y}` });

export default function DQNPage() {
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

        <ControlPanel />

        <BottomSection />
      </div>

      <ConnectionDisplay hide />
    </>
  );
}
