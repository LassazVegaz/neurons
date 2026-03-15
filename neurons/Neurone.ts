import { getMean, getStandardDeviation } from "./lib/statistics.js";
import { unblockThread } from "./lib/thread.js";

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

/**
 * Normalization parameters need by `Network` to train and predict
 * data
 */
export type NormalizationParameters = {
  mean: number;
  standardDeviation: number;
};

export type Model = {
  thetas: ModelParameters;
  norm: NormalizationParameters;
};

type PredictionResults = {
  activations: number[][];
  preActivations: number[][];
};

export type TrainParams = {
  thetas: ModelParameters;
  norm: NormalizationParameters;
  alpha: number;
  iterations: number;
};

/**
 * Parameters for events
 */
type EventParams = {
  /**
   * When an iteration finishes
   */
  iterationFinish: [iteration: number, mse: number];
  /**
   * When the training finishes
   */
  trainingFinish: [thetas: ModelParameters];
  /**
   * When the training is stopped because the client
   * requested it
   */
  trainingStopRequestFulfilled: [];
};

const relU = (x: number) => Math.max(0, x);
const dRelU = (x: number) => (x > 0 ? 1 : 0);

/**
 * Release thread for other work after this much of iterations
 * in training
 */
const UNBLOCK_BREAKER = 1000;

/**
 * A basic Deep Learning Network 😒
 */
export class Network {
  /**
   * If `true`, client has requested to stop training. Set to `false`
   * as soon as the request is fulfilled.
   */
  private requestedToStopTraining = false;

  /**
   * Events the client is listening to
   */
  private readonly events: {
    [E in keyof EventParams]?: ((...args: EventParams[E]) => void)[];
  } = {};

  /**
   * Create a beautiful Deep Learning Network 😇
   * @param f The function that can generate actual values
   * @param layers Layers of the netwok including the input and output layers.
   * Each number in the array represents the number of neurons in that layer
   * @param inputs Training data
   */
  constructor(
    private readonly f: (x: number) => number,
    private readonly layers: number[],
    private readonly inputs: number[],
  ) {}

  /**
   * Listen to an event 👂
   * @param event Event type
   * @param listener Listener function
   */
  on<E extends keyof EventParams>(
    event: E,
    listener: (...args: EventParams[E]) => void,
  ) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event]?.push(listener);
  }

  /**
   * Request to stop training. Once stopped `stopRequestFulfilled` event
   * will be emmited
   */
  requestToStop() {
    this.requestedToStopTraining = true;
  }

  /**
   * Train the neural network
   * @param inputs Inputs for training. Set of Xs
   * @param thetas Parameters. Weights and biases of the network.
   * Pass in the previously calculated parameters or use `createThetas`
   * to create new random parameters.
   */
  async train(p: TrainParams) {
    const inputs = this.normalizeInputs(this.inputs, p.norm);

    for (let i = 0; i < p.iterations; i++) {
      // request to stop training will be checked at beginning of every itr
      if (this.requestedToStopTraining) break;

      /**
       * Mean squared error
       */
      let mse = 0;

      // derivatives
      const d = this.createThetas(0);

      // forward
      for (const x of inputs) {
        const results = this.h(x, p.thetas);
        this.accumulateDerivatives(x, p.thetas, d, results);

        const predicted = results.activations.at(-1)![0];
        mse += (this.f(x) - predicted) ** 2;
      }
      mse /= inputs.length * 2;

      this.applyDerivatives(d, p.thetas, inputs.length, p.alpha);

      this.fire("iterationFinish", i, mse);

      if (i % UNBLOCK_BREAKER === 0) await unblockThread();
    }

    if (this.requestedToStopTraining) {
      this.requestedToStopTraining = false;
      this.fire("trainingStopRequestFulfilled");
    } else {
      this.fire("trainingFinish", p.thetas);
    }
  }

  predict(x: number, model: Model): number {
    const [normedX] = this.normalizeInputs([x], model.norm);
    const { activations } = this.h(normedX, model.thetas);
    const normedY = activations.at(-1)![0];
    const y = normedY * model.norm.standardDeviation + model.norm.mean;
    return y;
  }

  /**
   * Get normalization parameters of this model
   * @param inputs Inputs used to train the model (training data)
   * @returns Normalization parameters needed by this model to be trained using `inputs`
   */
  getNormalizationParameters(inputs: number[]): NormalizationParameters {
    return {
      mean: getMean(inputs),
      standardDeviation: getStandardDeviation(inputs),
    };
  }

  /**
   * Initialize the model.\
   * Weights will be initialized using He. Biases are set to 0.
   * Normalization parameters are created such that they fit with
   * `Neurone` training.\
   * Once initialized, you can save the `Model` for future training.
   */
  initializeModel(): Model {
    return {
      norm: {
        mean: getMean(this.inputs),
        standardDeviation: getStandardDeviation(this.inputs),
      },
      thetas: this.createThetas(),
    };
  }

  /**
   * Create thetas using He initialization method \
   * 1D size = number of layers - 1. \
   * 2D first element refers to the 2nd layer neurons. \
   * 3D first element refers to the previous layer neurons. \
   */
  private createThetas(): ModelParameters;
  /**
   * Create thetas filled with the given `value` \
   * 1D size = number of layers - 1. \
   * 2D first element refers to the 2nd layer neurons. \
   * 3D first element refers to the previous layer neurons. \
   */
  private createThetas(value: number): ModelParameters;
  private createThetas(value?: number): ModelParameters {
    const thetas: ModelParameters = { b: [], w: [] };

    // thetas exist in the gaps between layers
    // hence the size of 1st dimension is no of layers - 1
    for (let a = 0; a < this.layers.length - 1; a++) {
      const variance = Math.sqrt(2 / this.layers[a]);

      thetas.b.push([]);
      thetas.w.push([]);

      for (let b = 0; b < this.layers[a + 1]; b++) {
        thetas.b[a].push(value ?? 0);
        thetas.w[a].push([]);
        for (let c = 0; c < this.layers[a]; c++)
          thetas.w[a][b].push(value ?? this.random(-variance, variance));
      }
    }

    return thetas;
  }

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

  private random(min: number, max: number) {
    return Math.random() * (max - min) + min;
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

  private normalizeInputs(inputs: number[], norm: NormalizationParameters) {
    return inputs.map((x) => (x - norm.mean) / norm.standardDeviation);
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

  private fire<E extends keyof EventParams>(event: E, ...args: EventParams[E]) {
    if (!this.events[event]) return;
    for (const listener of this.events[event]) {
      listener(...args);
    }
  }
}
