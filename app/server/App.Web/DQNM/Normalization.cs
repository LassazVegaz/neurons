namespace App.Web.DQNM;

internal static class Normalization
{
    public static int[][] DenormalizeStates(double[][] normS)
    {
        var states = new int[normS.Length][];

        for (var i = 0; i < normS.Length; i++)
        {
            states[i] = new int[normS[i].Length];

            var l = normS[i].Length - 1; // first 4 are coordis
            for (var j = 0; j < l; j++)
                states[i][j] = (int)(normS[i][j] * 10);

            states[i][^1] = (int)(normS[i][^1] * (Constants.MAX_PERIODS - 1)); // time
        }

        return states;
    }
}
