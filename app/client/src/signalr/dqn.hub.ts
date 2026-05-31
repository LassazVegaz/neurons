import { HubTrainParameters } from "./dqn.hub.types";
import Hub, { makeHub } from "./hub";
import { GameResults } from "./qlearning.hub.types";

type Events = {
  TrainingStopped: [];
  TrainingFinished: [GameResults];
  GameFinished: [GameResults];
};

type Methods = {
  StartTraining: [HubTrainParameters];
  StopTraining: [];
};

export type DQNHub = Hub<Events, Methods>;

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
