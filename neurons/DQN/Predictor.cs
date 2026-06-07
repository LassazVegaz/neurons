using Neurons.Network;

namespace Neurons.DQN;

public class Predictor(Thetas t, int[] layers)
{
    readonly int[] layers = layers;

    public Thetas t = t;


    public ForwardResults Forward(double[] x)
    {
        var a = new double[layers.Length][];
        a[0] = x;

        var befA = new double[layers.Length][];
        befA[0] = x;

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
                a[nxtLayerI][j] = Activations.RelU(nInput);
            }
        }

        return new() { a = a, befA = befA };
    }
}
