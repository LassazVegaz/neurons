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
    public required Func<double, ActionResults> act;
}

public class ActionResults
{
    public required double reward;
    public required bool gameOver;
    public double[] nextState = [];
}