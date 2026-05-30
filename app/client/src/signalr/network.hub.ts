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

export type NetworkHub = Hub<Events, Methods>;

let hub: NetworkHub | undefined;

export default function getNetworkHub() {
  hub ??= makeHub<Events, Methods>(process.env.NEXT_PUBLIC_NETWORK_HUB);
  return hub;
}
