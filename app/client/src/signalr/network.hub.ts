"use client";
import { TrainingResult, TrainParams } from "./network.hub.types";
import { makeHub } from "./hub";

type Events = {
  TrainingFinished: [TrainingResult[]];
  TrainingStopped: [];
  IterationBreak: [number, number[]];
};

type Methods = {
  Train: [TrainParams];
  StopTraining: [];
};

export type NetworkHub = ReturnType<typeof getNetworkHub>;

export default function getNetworkHub() {
  return makeHub<Events, Methods>(process.env.NEXT_PUBLIC_NETWORK_HUB);
}
