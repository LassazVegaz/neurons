namespace Neurons.Network;

public static class ThetasInitializations
{
    public static Thetas HeInitialization(int[] layers)
    {
        var gaps = layers.Length - 1;
        var t = new Thetas()
        {
            b = new double[gaps][],
            w = new double[gaps][][]
        };

        for (var a = 0; a < gaps; a++)
        {
            t.b[a] = new double[layers[a + 1]];
            t.w[a] = new double[layers[a + 1]][];

            // upper bound and lower bound for random numbers
            var uBound = Math.Sqrt(2d / layers[a]); // std
            var lBound = -uBound;
            var range = uBound - lBound;

            for (var b = 0; b < layers[a + 1]; b++)
            {
                t.w[a][b] = new double[layers[a]];

                for (var c = 0; c < layers[a]; c++)
                {
                    t.w[a][b][c] = Random.Shared.NextDouble() * range + lBound;
                }
            }
        }

        return t;
    }

    public static Thetas ZeroInitialization(int[] layers)
    {
        var gaps = layers.Length - 1;
        var t = new Thetas()
        {
            b = new double[gaps][],
            w = new double[gaps][][]
        };

        for (var a = 0; a < gaps; a++)
        {
            int nxtLayerNeuronsCount = layers[a + 1];
            t.b[a] = new double[nxtLayerNeuronsCount];
            t.w[a] = new double[nxtLayerNeuronsCount][];

            for (var b = 0; b < nxtLayerNeuronsCount; b++)
                t.w[a][b] = new double[layers[a]];
        }

        return t;
    }

    public static Thetas Clone(this Thetas t)
    {
        var res = new Thetas
        {
            b = new double[t.b.Length][],
            w = new double[t.w.Length][][]
        };

        for (var a = 0; a < t.w.Length; a++)
        {
            res.b[a] = (double[])t.b[a].Clone();
            res.w[a] = new double[t.w[a].Length][];

            for (var b = 0; b < res.w[a].Length; b++)
                res.w[a][b] = (double[])t.w[a][b].Clone();
        }

        return res;
    }
}
