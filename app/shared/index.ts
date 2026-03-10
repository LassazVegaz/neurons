import { TrainParams } from "neurons";

export interface ClientToServerEvents {
  train: (
    params: Pick<TrainParams, "alpha" | "iterations"> & {
      layers: number[];
      newThetas: boolean;
    },
  ) => void;
  requestToStopTraining: () => void;
}

export type FinishedTrainingResults = {
  x: number;
  actual: number;
  prediction: number;
}[];

export interface ServerToClientEvents {
  finishedTraining: (results: FinishedTrainingResults) => void;
  iterationsBreak: (iteration: number, MSEs: number[]) => void;
  requestToStopTrainingFulfilled: () => void;
}
