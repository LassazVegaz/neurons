"use client";
import { TrainingResult, TrainParams } from "./network.hub.types";
import Hub, { makeHub } from "./hub";

type Events = {
  TrainingFinished: [TrainingResult[]];
  TrainingStopped: [];
  IterationBreak: [number, number[]];
};

type Methods = {
  Train: [TrainParams];
  StopTraining: [];
};

type Functions = Record<string, [[], unknown]>;

export type NetworkHub = Hub<Events, Methods, Functions>;

let hub: NetworkHub | undefined;

export default function getNetworkHub() {
  hub ??= makeHub<Events, Methods, Functions>(
    process.env.NEXT_PUBLIC_NETWORK_HUB,
  );
  return hub;
}
