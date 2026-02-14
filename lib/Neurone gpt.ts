export type ActivationFunction = (x: number) => number;

export type Params = { weights: number[][][]; biases: number[][] };

export type ForwardCache = {
  activations: number[][];
  preActivations: number[][];
};

const relu: ActivationFunction = (x) => Math.max(0, x);
const dRelu = (x: number) => (x > 0 ? 1 : 0);

export class Network {
  /**
   * @param layerSizes each element represents number of nurons in each layer
   */
  constructor(private readonly layerSizes: number[]) {
    if (layerSizes.length < 2) {
      throw new Error("Network must have at least input and output layers.");
    }
  }

  /**
   * weights = weight of eahc inputs to a nurone \
   * 1st D = layer index starting from 2nd layer \
   * 2nd D = nurone index of the layer \
   * 3rd D = index of the weights of outputs of each nurone in the previous layer \
   * Similar for biases. Difference is that the biases of all outputs of previous nurones
   * are accumulated into one value
   */
  createZeroParams(): Params {
    // 1st d size = number of layers - 1
    // 2n d size = number of nurones in the layer (n + 1)
    // 3rd d size = number of nurones in the layer n
    // filled with 0s
    // [layers excluding 1st] [no of nurones in the layer] [number of nurones in the previous layer]
    // stores weights of connections from the previous layer to each nurone
    const weights = this.layerSizes.slice(1).map((size, index) => {
      const prevSize = this.layerSizes[index];
      return Array.from({ length: size }, () => new Array(prevSize).fill(0));
    });

    // similar to weights
    // but only 2D
    // because there is only one connection from the previous layer
    // to each nurone
    const biases = this.layerSizes
      .slice(1)
      .map((size) => new Array(size).fill(0));

    return { weights, biases };
  }

  createRandomParams(scale = 0.1): Params {
    // for 0.1 scale, generates numbers less than 0.1
    const params = this.createZeroParams();
    params.weights = params.weights.map((layer) =>
      layer.map((neuron) => neuron.map(() => (Math.random() * 2 - 1) * scale)),
    );
    params.biases = params.biases.map((layer) =>
      layer.map(() => (Math.random() * 2 - 1) * scale),
    );
    return params;
  }

  /**
   * preActivations = value before activating in each nurone \
   * activations = value after activating in each nurone \
   * 1st D = layer index \
   * 2nd D = nurone index \
   * Note: in first and last layer, value before and after activating are the same
   * became those layers do not have activation functions.
   * The first layer holds the raw inputs and the last layer is the output
   * of the forward pass
   */
  forward(input: number[], params: Params): ForwardCache {
    // input is only one example from the dataset
    if (input.length !== this.layerSizes[0]) {
      throw new Error("Input size does not match network input layer.");
    }

    // activated results from every nurone except from the last and first layers
    // for first layer, they are the raw inputs. for last layer, they are the raw outputs
    const activations: number[][] = [input];
    // inputs to every nurone
    // since these are the values before action, these are called preActivations
    const preActivations: number[][] = [input];
    // in both above arrays,
    // 1st D = layer index
    // 2nd D = nurone index

    // go through every layer
    for (let layer = 0; layer < this.layerSizes.length - 1; layer++) {
      const prevActivation = activations[layer]; // 0 itr: input
      const layerWeights = params.weights[layer]; // all the weights from current layer
      const layerBiases = params.biases[layer]; // all biases from current layer

      // size = layerWeights.length = number of nurones in the next layer
      // z = inputs to next layer nurones
      const z: number[] = new Array(layerWeights.length).fill(0);
      // a = activated z. for last layer it is just z
      // because laster layer doesnt have an activation function
      const a: number[] = new Array(layerWeights.length).fill(0);

      /**
       * Following for loop calculate inputs to the next layer nurones
       * And also activation results of next layer nurones
       * For the last layer nurone, it is just the input, no activations
       */
      // go through every nurone in next layer
      for (let neuron = 0; neuron < layerWeights.length; neuron++) {
        // nurone = n = next layer nurone index
        // sum = bias from all previous nurones to n
        let sum = layerBiases[neuron];
        // 0 itr: go through every input
        for (let prev = 0; prev < prevActivation.length; prev++) {
          // 0 itr: prev = index of the input
          // sum += weight from prev to n * prev
          sum += layerWeights[neuron][prev] * prevActivation[prev];
        }
        // z[n] = input to n
        z[neuron] = sum;
        // a[n] = activation
        // since the last layer does not need to be activated, last layer is ignored
        a[neuron] = layer === this.layerSizes.length - 2 ? sum : relu(sum);
      }

      preActivations.push(z);
      activations.push(a);
    }

    return { activations, preActivations };
  }

  /**
   *
   * @param target Actual output
   * @param params
   * @returns
   */
  backward(input: number[], target: number[], params: Params) {
    const cache = this.forward(input, params);
    const { activations, preActivations } = cache;

    // last layer index
    const lastIndex = this.layerSizes.length - 1;
    // predicated output
    const output = activations[lastIndex];

    if (target.length !== output.length) {
      throw new Error("Target size does not match output layer.");
    }

    // 1st D = layer index
    const deltas: number[][] = this.layerSizes.map(() => []);
    let loss = 0;

    // dLoss/dOutput for MSE with linear output: (output - target)
    // deltas[last layer] = sum(square of error) * 0.5
    deltas[lastIndex] = output.map((value, index) => {
      const diff = value - target[index];
      loss += 0.5 * diff * diff;
      return diff;
    });

    // go from one before last later to first one (output - 1 to input)
    for (let layer = lastIndex - 1; layer > 0; layer--) {
      // Backpropagate through weights and apply ReLU derivative to hidden layers.
      // size = number of nurones in the layer
      const layerDelta = new Array(this.layerSizes[layer]).fill(0);
      // size = no of nurones in the next layer
      // 0 itr: sum of squares of deltas / 2
      const nextDelta = deltas[layer + 1];
      // weights of outputs from this layer nurones to next layer nurones
      const nextWeights = params.weights[layer];

      // go through every nurone in the current layer
      for (let neuron = 0; neuron < this.layerSizes[layer]; neuron++) {
        let sum = 0;
        // 0 itr: [sum of square of errors  / 2]
        for (let next = 0; next < nextDelta.length; next++) {
          sum += nextWeights[next][neuron] * nextDelta[next];
        }
        layerDelta[neuron] = sum * dRelu(preActivations[layer][neuron]);
      }

      deltas[layer] = layerDelta;
    }

    const gradients = this.createZeroParams();

    for (let layer = 0; layer < this.layerSizes.length - 1; layer++) {
      const layerDelta = deltas[layer + 1];
      const prevActivation = activations[layer];

      for (let neuron = 0; neuron < layerDelta.length; neuron++) {
        gradients.biases[layer][neuron] += layerDelta[neuron];
        for (let prev = 0; prev < prevActivation.length; prev++) {
          gradients.weights[layer][neuron][prev] +=
            layerDelta[neuron] * prevActivation[prev];
        }
      }
    }

    return { gradients, loss, cache };
  }
}
