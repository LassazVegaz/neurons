import {
  GameResults,
  HubTrainParameters,
  LastUsedParams,
} from "./dqn.hub.types";
import Hub, { makeHub } from "./hub";

type Events = {
  TrainingStopped: [];
  TrainingFinished: [GameResults];
  GameFinished: [GameResults];
};

type Methods = {
  StartTraining: [HubTrainParameters];
  StopTraining: [];
};

type Functions = {
  GetLastUsedParams: [[], LastUsedParams | null];
  GetTheBestGame: [[], GameResults | null];
};

export type DQNHub = Hub<Events, Methods, Functions>;

let hub: DQNHub | undefined;

const getDQNHub = () => {
  if (!hub) {
    const url = process.env.NEXT_PUBLIC_DQN_HUB;
    if (!url) throw new Error("NEXT_PUBLIC_DQN_HUB is not defined");
    hub = makeHub(url);
  }

  return hub;
};

export default getDQNHub;
