using Neurons.Network;

namespace Neurons.DQN;

internal class Optimizer(int[] layers, Thetas t, double alpha)
{
    readonly int[] layers = layers;
    readonly Thetas t = t;
    readonly double alpha = alpha;


    public void Optimize(ForwardResults predicted, double targetQ, int a)
    {
        // construct y (targets) for backprop
        var y = (double[])predicted.befA[^1].Clone();
        y[a] = targetQ;

        // back propagation and updating thetas
        var dT = Backward(predicted, y);
        UpdateThetas(dT, alpha);
    }


    Thetas Backward(ForwardResults fResult, double[] y)
    {
        var dT = ThetasInitializations.ZeroInitialization(layers);
        var predicted = fResult.befA[^1];

        // error signals comming from every neurone
        var eSignal = new double[layers.Length][];
        eSignal[^1] = new double[y.Length];
        for (var b = 0; b < y.Length; b++)
            eSignal[^1][b] = -(y[b] - predicted[b]);

        // from the last layer to the first one
        for (var b = layers.Length - 1; b > 0; b--)
        {
            var prevLayerI = b - 1; // prev layer index
            var gapI = b - 1; // gap index for thetas

            // for every neurone in the current layer
            for (var c = 0; c < layers[b]; c++)
            {
                // accumulating partial derivative of bias
                dT.b[gapI][c] += eSignal[b][c];

                // for every neurone in the previous layer
                for (var d = 0; d < layers[prevLayerI]; d++)
                {
                    // accumulating partial derivative of weights
                    dT.w[gapI][c][d] += fResult.a[prevLayerI][d] * eSignal[b][c];
                }
            }

            // calculating error signals
            eSignal[prevLayerI] = new double[layers[prevLayerI]];

            // for every neurone in the previous layer
            for (var c = 0; c < layers[prevLayerI]; c++)
            {
                // for every neurone in the current layer
                for (var d = 0; d < layers[b]; d++)
                {
                    eSignal[prevLayerI][c] +=
                       Derivatives.DRelU(fResult.befA[prevLayerI][c]) *
                       t.w[gapI][d][c] * eSignal[b][d];
                }
            }
        }

        return dT;
    }

    void UpdateThetas(Thetas dT, double alpha)
    {
        for (var b = 0; b < layers.Length - 1; b++)
        {
            for (var c = 0; c < layers[b + 1]; c++)
            {
                t.b[b][c] -= alpha * dT.b[b][c];

                for (var d = 0; d < layers[b]; d++)
                    t.w[b][c][d] -= alpha * dT.w[b][c][d];
            }
        }
    }
}
