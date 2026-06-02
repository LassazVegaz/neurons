using Neurons.Network;

namespace Neurons.DQN;

public class TrainParameters
{
    /// <summary>
    /// A pre-trained set of thetas. If pre-trained thetas are not available use
    /// <see cref="ThetasInitializations.HeInitialization(int[])"/> to create thetas
    /// </summary>
    public required Thetas t;
    /// <summary>
    /// Maximum number of allowed actions
    /// </summary>
    public required int noOfActions;

    /// <summary>
    /// Perform an action return the next state
    /// </summary>
    public required Func<PeriodContext, ActionResults> act;

    public required int iterations;
    public required int maxPeriods;
    public required double[] initialState;
    public required double lambda;
    public required double alpha;
    public required int[] layers;
    public required bool noGreedy;
    public required int replayBufferSize;
    public required int networksSyncingPeriod;
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

public class GameResults
{
    public required double[] initialState;
    public required double totalRewards;
    public required int[] actions;
    public required int iteration;
}

internal class Experience(ForwardResults predicted, int action, double targetQ)
{
    public ForwardResults predicted = predicted;
    public int a = action;
    public double targetQ = targetQ;
}