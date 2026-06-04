namespace Neurons.DQN;

internal static class Normalization
{
    public static int[][] DenormalizeStates(double[][] normS)
    {
        var states = new int[normS.Length][];

        for (var i = 0; i < normS.Length; i++)
        {
            var l = normS[i].Length - 1; // ignore time state
            states[i] = new int[l];

            for (var j = 0; j < l; j++)
                states[i][j] = (int)(normS[i][j] * 10);
        }

        return states;
    }
}
