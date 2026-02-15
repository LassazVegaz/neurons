import { MSECalculator } from "./MSECalculator.js";

/**
 * Weights and biases in the gaps between layers
 */
export type ModelParameters = {
  /**
   * [layer][neuron][weight of connection from previous layer neuron]
   */
  w: number[][][];
  /**
   * [layer][neuron]
   */
  b: number[][];
};

type PredictionResults = {
  activations: number[][];
  preActivations: number[][];
};

type TrainParams = {
  inputs: number[];
  thetas: ModelParameters;
  alpha: number;
};

const relU = (x: number) => Math.max(0, x);
const dRelU = (x: number) => (x > 0 ? 1 : 0);

export class Network {
  constructor(
    private readonly f: (x: number) => number,
    private readonly layers: number[],
  ) {}

  /**
   * Get results from the network
   * @param thetas So far calculated thetas.
   * @returns Values after and before activating each neurone.
   */
  private h(x: number, thetas: ModelParameters) {
    const activations = [[x]];
    const preActivations = [[x]];

    // do the job for the next layer neurons
    // pre activations -> actions
    for (let a = 0; a < this.layers.length - 1; a++) {
      preActivations.push([]);
      activations.push([]);

      // each neurone in the next layer
      for (let b = 0; b < this.layers[a + 1]; b++) {
        preActivations[a + 1][b] = thetas.b[a][b];

        // each neurone in current layer
        for (let c = 0; c < this.layers[a]; c++) {
          preActivations[a + 1][b] += thetas.w[a][b][c] * activations[a][c];
        }

        activations[a + 1][b] = this.activate(preActivations[a + 1][b], a + 1);
      }
    }

    return { preActivations, activations };
  }

  /**
   * Train the neural network
   * @param inputs Inputs for training. Set of Xs
   * @param thetas Parameters. Weights and biases of the network.
   * Pass in the previously calculated parameters or use `createEmptyParameters`
   * to create new empty parameters.
   */
  train(p: TrainParams) {
    const inputs = this.normalizeInput(p.inputs);

    const mse = new MSECalculator(1000, inputs.length, this.f);

    for (let i = 0; i < 10000; i++) {
      mse.iteration = i;
      // derivatives
      const d = this.createThetas(0);

      // forward
      for (const x of inputs) {
        const results = this.h(x, p.thetas);
        this.accumulateDerivatives(x, p.thetas, d, results);

        mse.addError(x, results.activations.at(-1)![0]);
      }

      mse.finishIteration();

      this.applyDerivatives(d, p.thetas, inputs.length, p.alpha);
    }
  }

  predict(x: number, thetas: ModelParameters) {
    const { activations } = this.h(x, thetas);
    return activations.at(-1)![0];
  }

  /**
   * Create thetas filled with the given `value` of a random value
   * 1D size = number of layers - 1.
   * 2D first element refers to the 2nd layer neurons.
   * 3D first element refers to the previous layer neurons.
   */
  createThetas(value?: number): ModelParameters {
    const thetas: ModelParameters = { b: [], w: [] };

    // thetas exist in the gaps between layers
    // hence the size of 1st dimension is no of layers - 1
    for (let a = 0; a < this.layers.length - 1; a++) {
      thetas.b.push([]);
      thetas.w.push([]);

      for (let b = 0; b < this.layers[a + 1]; b++) {
        thetas.b[a].push(value ?? this.random());
        thetas.w[a].push([]);
        for (let c = 0; c < this.layers[a]; c++)
          thetas.w[a][b].push(value ?? this.random());
      }
    }

    return thetas;
  }

  private random() {
    const sign = Math.random() > 0.5 ? -1 : 1;
    return (Math.floor(Math.random() * 10) / 10) * sign;
  }

  private accumulateDerivatives(
    x: number,
    thetas: ModelParameters,
    d: ModelParameters,
    r: PredictionResults,
  ) {
    const errorSignals: number[][] = [];

    // predicated value of the hypothesis function
    const h = r.activations.at(-1)![0];
    errorSignals[this.layers.length - 1] = [-(this.f(x) - h)];

    for (let a = this.layers.length - 1; a > 0; a--) {
      errorSignals[a - 1] = new Array<number>(this.layers[a - 1]).fill(0);

      // each neuron in this layer
      for (let b = 0; b < this.layers[a]; b++) {
        d.b[a - 1][b] += errorSignals[a][b];

        // each neuron from the previous layer
        for (let c = 0; c < this.layers[a - 1]; c++) {
          d.w[a - 1][b][c] += errorSignals[a][b] * r.activations[a - 1][c];

          errorSignals[a - 1][c] += thetas.w[a - 1][b][c] * errorSignals[a][b];
        }
      }

      for (let b = 0; b < this.layers[a - 1]; b++) {
        errorSignals[a - 1][b] *= dRelU(r.preActivations[a - 1][b]);
      }
    }
  }

  private normalizeInput(inputs: number[]) {
    const max = Math.max(...inputs);
    return inputs.map((x) => x / max);
  }

  /**
   * Divide partial derivatives by number of training data and subtract them from
   * parameters
   * @param derivatives Accumulated partial derivatives of `p`
   * @param thetas Parameters
   * @param m Number of inputs
   */
  private applyDerivatives(
    derivatives: ModelParameters,
    thetas: ModelParameters,
    m: number,
    alpha: number,
  ) {
    for (let a = 0; a < this.layers.length - 1; a++) {
      for (let b = 0; b < this.layers[a + 1]; b++) {
        derivatives.b[a][b] /= m;
        thetas.b[a][b] -= derivatives.b[a][b] * alpha;

        for (let c = 0; c < this.layers[a]; c++) {
          derivatives.w[a][b][c] /= m;
          thetas.w[a][b][c] -= derivatives.w[a][b][c] * alpha;
        }
      }
    }
  }

  /**
   * This is a helper function for `h`. If it is trying to activate last layer,
   * just return the pre activation without modifying
   * @param layer Layer index. 0 based
   * @returns If it is the last layer, return `x`. Otherwise `RelU(x)`.
   */
  private activate(x: number, layer: number) {
    return layer === this.layers.length - 1 ? x : relU(x);
  }
}
