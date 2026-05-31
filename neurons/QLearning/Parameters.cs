namespace Neurons.QLearning;

public class TrainParameters
{
    /// <summary>
    /// Number of states
    /// </summary>
    public required int noOfStates;

    /// <summary>
    /// Number of actions
    /// </summary>
    public required int noOfActions;

    /// <summary>
    /// Number of iterations the game should be trained for
    /// </summary>
    public required int iterations;

    /// <summary>
    /// The initial state of each game
    /// </summary>
    public required int initialState;

    public required double alpha;

    public required double lambda;

    // I know this is not understandable. But I like this word
    /// <summary>
    /// Perform an action
    /// </summary>
    public required Func<PeriodContext, ActionResults> Act;

    /// <summary>
    /// A pre-trained Q-Table. If not provided, an empty table will be
    /// created internally. Listen to <see cref="QLearning.TrainingFinished"/>
    /// to get the trained Q-Table.
    /// </summary>
    public double[][]? qTable;
}

public class PeriodContext
{
    /// <summary>
    /// Current period index. 0-based
    /// </summary>
    public required int period;

    /// <summary>
    /// Current state. 0-based
    /// </summary>
    public required int currentState;

    /// <summary>
    /// Action to be taken from <see cref="PeriodContext.currentState"/>
    /// </summary>
    public required int actionToTake;
}

public class ActionResults
{
    /// <summary>
    /// Reward if <see cref="PeriodContext.actionToTake"/> was taken
    /// from <see cref="PeriodContext.currentState"/>
    /// </summary>
    public required double reward;

    /// <summary>
    /// If true game will stop after performing the action.
    /// </summary>
    public required bool gameOver;

    /// <summary>
    /// Next state after performing <see cref="PeriodContext.actionToTake"/>
    /// from <see cref="PeriodContext.currentState"/>
    /// </summary>
    public required int nextState;
}

public class GameResults
{
    public required double[] initialState;
    public required double totalRewards;
    public required int[] actions;
    public required int iteration;
}