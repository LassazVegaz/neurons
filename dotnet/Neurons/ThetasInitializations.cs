namespace Neurons;

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
}
