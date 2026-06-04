namespace App.Web.DQNM;

public static class Constants
{
    public const int NO_OF_ACTIONS = 4;
    public const int MAX_PERIODS = 50;

    public static double[] InitialState => [0, 0, 0.9, 0.9, 0];
}
