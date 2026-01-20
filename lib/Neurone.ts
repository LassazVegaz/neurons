type ActivationFunction = (x: number) => number;

type Params = { w: number[][][]; b: number[][][] };

const endpointActivation: ActivationFunction = (x) => x;

class Snapshot {
  outputs: number[] = [];
}

class Neurone {
  input = 0;
  output = 0;

  constructor(public activate: ActivationFunction) {}
}

class Network {
  // assume there are 2 x 2 neurones
  neuronesCount = [1, 2, 2, 1];

  static createNetwork(f: (x: number) => number, nodes: Neurone[][]): Network {
    const start = new Neurone(endpointActivation);
    const end = new Neurone(endpointActivation);

    const _nodes = [[start], ...nodes, [end]];
    return new Network(f, _nodes);
  }

  private constructor(
    private readonly f: (x: number) => number,
    private readonly nodes: Neurone[][],
  ) {}

  private activate(x: number, layer: number) {
    if (layer === 0 || layer === this.neuronesCount.length - 1) return 0;
    else return Math.max(x, 0);
  }

  train(inputs: number[], p: Params) {
    // forward results
    const fRes: number[] = [];

    // forward
    for (const input of inputs) {
      // inputs for each neurone
      const x = inputs.map((i) => new Array<number>(i).fill(0));
      x[0][0] = input;

      // a = index of layer
      for (let a = 0; a < this.neuronesCount.length; a++) {
        const layer = this.neuronesCount[a];

        // b = neurone index in layer a
        for (let b = 0; b < layer; b++) {
          const output = this.activate(x[a][b], a);

          const nextLayerIdx = a + 1;
          if (nextLayerIdx === this.neuronesCount.length) {
            fRes.push(output);
          } else {
            const nextLayer = this.neuronesCount[nextLayerIdx];
            // c = neurone index in next layer
            for (let c = 0; c < nextLayer; c++) {
              const feed = p.w[a][b][c] * output + p.b[a][b][c];
              x[nextLayerIdx][c] += feed;
            }
          }
        }
      }
    }

    // backward
    let MSE = 0;
    let dPs: Params = { w: [], b: [] }; // derivatives of params

    for (let a = 0; a < fRes.length; a++) {
      const h = fRes[a];
      const x = inputs[a];
      const e = x - h;
      MSE += e ** 2;

      // start from the layer before last one
      // b = layer index
      for (let b = this.neuronesCount.length - 2; b >= 0; b--) {
        const layer = this.neuronesCount[b];
        // c = neurone index
        for (let c = b - 1; c >= 0; c--) {
          // d = param of next layer input
          for (let d = p.b[b][c].length - 1; d >= 0; d--) {
            const param = p.b[b][c][d];
            const dParam = 1; // dJ/dB[b][c][d]
            dPs.b[b][c][d] += dParam;
          }
        }
      }
    }

    MSE = (2 * MSE) / inputs.length;
    console.log(`MSE = ${MSE}`);
  }

  private createInitialParams() {
    const b = this.nodes.map((l) => [] as number[]);
    b.pop();

    const w = this.nodes.map((l) => [] as number[]);
    w.pop();

    return { b, w };
  }
}
