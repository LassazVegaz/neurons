import Hub, { makeHub } from "./hub";
import { HubTrainParameters } from "./qlearning.hub.types";

type Events = {
  GameFinished: [number[]];
  TrainingStopped: [];
  TrainingFinished: [];
};

type Methods = {
  Train: [HubTrainParameters];
  StopTraining: [];
};

export type QLearningHub = Hub<Events, Methods>;

let hub: QLearningHub | undefined;

export default function getQLearningHub() {
  hub ??= makeHub<Events, Methods>(process.env.NEXT_PUBLIC_QLEARNING_HUB);
  return hub;
}
