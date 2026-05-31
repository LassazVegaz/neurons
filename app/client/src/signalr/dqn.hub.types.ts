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
};
