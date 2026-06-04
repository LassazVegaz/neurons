export type HubTrainParameters = {
  alpha: number;
  lambda: number;
  layers: number[];
  createNewThetas: boolean;
  iterations: number;
};

export type LastUsedParams = {
  alpha: number;
  lambda: number;
  layers: number[];
  iterations: number;
  noGreedy: boolean;
};

export type GameResults = {
  totalRewards: number;
  states: number[][];
  actions: number[];
  iteration: number;
};
