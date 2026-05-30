using Neurons.Network;

namespace Neurons.DQN;

public class TrainParameters
{
    public required Thetas t;
    public required int iterations;
    public required int maxPeriods;
    public required double[] initialState;
    public required int noOfActions;
    public required double lambda;
    public required double alpha;
    public required Func<PeriodContext, ActionResults> act;
    public required int[] layers;
}

public class ActionResults
{
    public required double reward;
    public required bool gameOver;
    public double[] nextState = [];
}

public class PeriodContext
{
    /// <summary>
    /// Current period index. 0-based
    /// </summary>
    public required int period;

    /// <summary>
    /// Current state.
    /// </summary>
    public required double[] currentState;

    /// <summary>
    /// Action to be taken from <see cref="PeriodContext.currentState"/>
    /// </summary>
    public required int actionToTake;
}