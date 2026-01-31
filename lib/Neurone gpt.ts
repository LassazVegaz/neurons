export type ActivationFunction = (x: number) => number;

export type Params = { weights: number[][][]; biases: number[][] };

export type ForwardCache = {
  activations: number[][];
  preActivations: number[][];
};

const relu: ActivationFunction = (x) => Math.max(0, x);
const dRelu = (x: number) => (x > 0 ? 1 : 0);

export class Network {
  constructor(private readonly layerSizes: number[]) {
    if (layerSizes.length < 2) {
      throw new Error("Network must have at least input and output layers.");
    }
  }

  createZeroParams(): Params {
    const weights = this.layerSizes.slice(1).map((size, index) => {
      const prevSize = this.layerSizes[index];
      return Array.from({ length: size }, () => new Array(prevSize).fill(0));
    });

    const biases = this.layerSizes
      .slice(1)
      .map((size) => new Array(size).fill(0));

    return { weights, biases };
  }

  createRandomParams(scale = 0.1): Params {
    const params = this.createZeroParams();
    params.weights = params.weights.map((layer) =>
      layer.map((neuron) => neuron.map(() => (Math.random() * 2 - 1) * scale)),
    );
    params.biases = params.biases.map((layer) =>
      layer.map(() => (Math.random() * 2 - 1) * scale),
    );
    return params;
  }

  forward(input: number[], params: Params): ForwardCache {
    if (input.length !== this.layerSizes[0]) {
      throw new Error("Input size does not match network input layer.");
    }

    const activations: number[][] = [input];
    const preActivations: number[][] = [input];

    for (let layer = 0; layer < this.layerSizes.length - 1; layer++) {
      const prevActivation = activations[layer];
      const layerWeights = params.weights[layer];
      const layerBiases = params.biases[layer];

      const z: number[] = new Array(layerWeights.length).fill(0);
      const a: number[] = new Array(layerWeights.length).fill(0);

      for (let neuron = 0; neuron < layerWeights.length; neuron++) {
        let sum = layerBiases[neuron];
        for (let prev = 0; prev < prevActivation.length; prev++) {
          sum += layerWeights[neuron][prev] * prevActivation[prev];
        }
        z[neuron] = sum;
        a[neuron] = layer === this.layerSizes.length - 2 ? sum : relu(sum);
      }

      preActivations.push(z);
      activations.push(a);
    }

    return { activations, preActivations };
  }

  backward(input: number[], target: number[], params: Params) {
    const cache = this.forward(input, params);
    const { activations, preActivations } = cache;

    const lastIndex = this.layerSizes.length - 1;
    const output = activations[lastIndex];

    if (target.length !== output.length) {
      throw new Error("Target size does not match output layer.");
    }

    const deltas: number[][] = this.layerSizes.map(() => []);
    let loss = 0;

    // dLoss/dOutput for MSE with linear output: (output - target)
    deltas[lastIndex] = output.map((value, index) => {
      const diff = value - target[index];
      loss += 0.5 * diff * diff;
      return diff;
    });

    for (let layer = lastIndex - 1; layer > 0; layer--) {
      // Backpropagate through weights and apply ReLU derivative to hidden layers.
      const layerDelta = new Array(this.layerSizes[layer]).fill(0);
      const nextDelta = deltas[layer + 1];
      const nextWeights = params.weights[layer];

      for (let neuron = 0; neuron < this.layerSizes[layer]; neuron++) {
        let sum = 0;
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
