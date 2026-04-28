namespace Neurons;

public class Network(NetworkParameters networkParams)
{
    private const int ITERATIONS = 1000;

    readonly int[] layers = networkParams.layers;
    readonly Func<double, double> f = networkParams.f;
    readonly NormalizationParameters normParams = networkParams.normParams;

    public double Predict(double x, Thetas t)
    {
        x = Normalize(x);
        var predicted = Forward(x, t).a[^1][0];
        return Denormalize(predicted);
    }

    public void Train(double[] inputs, Thetas t)
    {
        inputs = [.. inputs.Select(Normalize)];

        for (var a = 0; a < ITERATIONS; a++) // for every iteration
        {
            // partial derivatives
            var dT = CreateThetas();

            foreach (var x in inputs)
            {
                var fResult = Forward(x, t);
                Backward(t, dT, fResult);
            }

            UpdateThetas(t, dT, inputs.Length);
        }
    }

    /// <summary>
    /// Create empty thetas. Only the 1sr dimension of weights and
    /// biases are initialized
    /// </summary>
    private Thetas CreateThetas()
    {
        var gaps = layers.Length - 1;
        return new()
        {
            w = new double[gaps][][],
            b = new double[gaps][]
        };
    }

    private ForwardResults Forward(double x, Thetas t)
    {
        var a = new double[layers.Length][];
        a[0] = [x];

        var befA = new double[layers.Length][];
        befA[0] = [x];

        // For every layer except for the last one
        // Activations are calculated for the layer ahead
        for (var i = 0; i < layers.Length - 1; i++)
        {
            var nxtLayerI = i + 1;
            befA[nxtLayerI] = new double[layers[nxtLayerI]];
            a[nxtLayerI] = new double[layers[nxtLayerI]];

            // For every neurone in the next layer
            for (var j = 0; j < layers[nxtLayerI]; j++)
            {
                var nInput = t.b[i][j]; // Neurone input

                // For every neurone in the current layer
                for (var k = 0; k < layers[i]; k++)
                    nInput += t.w[i][j][k] * a[i][k];

                // Final calculation of activations
                // in the next layer
                befA[nxtLayerI][j] = nInput;
                a[nxtLayerI][j] = Activate(nInput);
            }
        }

        return new() { a = a, befA = befA };
    }

    private void Backward(Thetas t, Thetas dT, ForwardResults fResult)
    {
        var x = fResult.a[0][0];
        var predicted = fResult.a[^1][0];

        // error signals comming from every neurone
        var eSignal = new double[layers.Length][];
        var E = -(f(x) - predicted);
        eSignal[^1] = [E];

        // from the last layer to the first one
        for (var b = layers.Length - 1; b >= 0; b--)
        {
            var prevLayerI = b - 1; // prev layer index
            var gapI = b - 1; // gap index for thetas

            dT.b[gapI] = new double[layers[b]];
            dT.w[gapI] = new double[layers[b]][];

            // for every neurone in the current layer
            for (var c = 0; c < layers[b]; c++)
            {
                dT.w[gapI][c] = new double[layers[prevLayerI]];

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
                        DRelU(fResult.befA[prevLayerI][c]) * t.w[gapI][d][c] * eSignal[b][d];
                }
            }
        }
    }

    private void UpdateThetas(Thetas t, Thetas dT, int m)
    {
        for (var b = 0; b < layers.Length - 2; b++)
        {
            for (var c = 0; c < layers[b + 1]; c++)
            {
                dT.b[b][c] /= m;
                t.b[b][c] -= dT.b[b][c];

                for (var d = 0; d < layers[b]; d++)
                {
                    dT.w[b][c][d] /= m;
                    t.w[b][c][d] -= dT.w[b][c][d];
                }
            }
        }
    }

    private double Normalize(double x) => (x - normParams.mean) / normParams.standardDeviation;

    private double Denormalize(double x) => x * normParams.standardDeviation + normParams.mean;

    private static double Activate(double x) => x > 0 ? x : 0;

    private static double DRelU(double x) => x > 0 ? 1 : 0;
}

/**
 * If there are l layers,
 * there are l-1 gaps between them.
 * each neuron (n) in a layer is connected to every neuron in the next layer (m).
 * weights will be like [l][m][n]
 * next layer gets the priority because of how biases work
 * Unlike weights, there is only one bias per neuron, so biases will be like [l][m]
 * 
 * Magnitude of error = 1/2m * E( y - h )^2
 * D of M = -1/m * E( y - h )
 */