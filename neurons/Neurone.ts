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

export type TrainParams = {
  inputs: number[];
  thetas: ModelParameters;
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
   */
  constructor(
    private readonly f: (x: number) => number,
    private readonly layers: number[],
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
   * Pass in the previously calculated parameters or use `createEmptyParameters`
   * to create new empty parameters.
   */
  async train(p: TrainParams) {
    const inputs = this.normalizeInput(p.inputs);

    for (let i = 0; i < p.iterations; i++) {
      // request to stop training will be checked at beginning of every itr
      if (this.requestedToStopTraining) {
        this.fulfillTrainingStop();
        break;
      }

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

      if (i % UNBLOCK_BREAKER === 0) await this.unblockThread();
    }

    this.fire("trainingFinish", p.thetas);
  }

  predict(x: number, thetas: ModelParameters): number {
    const { activations } = this.h(x, thetas);
    return activations.at(-1)![0];
  }

  createThetas(): ModelParameters;
  createThetas(value: number): ModelParameters;
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

  private fire<E extends keyof EventParams>(event: E, ...args: EventParams[E]) {
    if (!this.events[event]) return;
    for (const listener of this.events[event]) {
      listener(...args);
    }
  }

  private unblockThread() {
    return new Promise<void>((res) => setInterval(res));
  }

  /**
   * Call this function once the training loop broke out because the client
   * requested to stop training.
   */
  private fulfillTrainingStop() {
    this.requestedToStopTraining = false;
    this.fire("trainingStopRequestFulfilled");
  }
}
