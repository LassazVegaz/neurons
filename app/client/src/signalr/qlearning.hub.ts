import { makeHub } from "./hub";
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

export default function getQLearningHub() {
  return makeHub<Events, Methods>(process.env.NEXT_PUBLIC_QLEARNING_HUB);
}

export type QLearningHub = ReturnType<typeof getQLearningHub>;
