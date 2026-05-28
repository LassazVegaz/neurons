"use client";
import ControlPanelContainer from "@/components/ControlPanelContainer";
import { Button, Checkbox, TextField } from "@/components/Fields";

const arr = [] as number[];
for (let i = 0; i < 100; i++) arr.push(i);

export default function QLearningPage() {
  return (
    <div className="h-full grid grid-cols-[1fr_300px] grid-rows-[1fr_150px]">
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-10 gap-1">
          {arr.map((i) => (
            <div key={i} className="h-10 w-10 border border-blue-300 rounded" />
          ))}
        </div>
      </div>
      <ControlPanelContainer className="border-l border-blue-400">
        <Checkbox
          checked
          label="New table"
          name="CreateNewTable"
          onChange={() => {}}
        />
        <TextField
          label="Iterations"
          name="Iterations"
          value=""
          onChange={() => {}}
        />
        <TextField label="Alpha" name="Alpha" value="" onChange={() => {}} />
        <TextField label="Lambda" name="Lambda" value="" onChange={() => {}} />
        <Button className="border border-blue-600 mt-10">Train</Button>
      </ControlPanelContainer>
      <div className="bg-blue-950 col-span-2"></div>
    </div>
  );
}
