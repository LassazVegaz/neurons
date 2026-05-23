export type TrainingResult = {
  x: number;
  y: number;
  predicted: number;
};

export type TrainParams = {
  layers: number[];
  newThetas: boolean;
  alpha: number;
  iterations: number;
};
