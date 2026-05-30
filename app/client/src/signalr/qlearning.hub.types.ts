export type HubTrainParameters = {
  alpha: number;
  lambda: number;
  iterations: number;
  createNewTable: boolean;
};

export type GameResults = {
  totalRewards: number;
  actions: number[];
  iteration: number;
};
