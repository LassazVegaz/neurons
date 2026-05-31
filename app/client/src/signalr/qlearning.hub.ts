import Hub, { makeHub } from "./hub";
import { GameResults, HubTrainParameters } from "./qlearning.hub.types";

type Events = {
  GameFinished: [GameResults];
  TrainingStopped: [];
  TrainingFinished: [];
};

type Methods = {
  Train: [HubTrainParameters];
  StopTraining: [];
};

type Functions = Record<string, [[], []]>;

export type QLearningHub = Hub<Events, Methods, Functions>;

let hub: QLearningHub | undefined;

export default function getQLearningHub() {
  hub ??= makeHub<Events, Methods, Functions>(
    process.env.NEXT_PUBLIC_QLEARNING_HUB,
  );
  return hub;
}
