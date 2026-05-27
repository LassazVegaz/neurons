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
    public required Func<StepContext, ActionResults> Act;

    /// <summary>
    /// A pre-trained Q-Table. If not provided, an empty table will be
    /// created internally. Listen to <see cref="QLearning.TrainingFinished"/>
    /// to get the trained Q-Table.
    /// </summary>
    public double[][]? qTable;
}

public class StepContext
{
    /// <summary>
    /// Current step. 0-based
    /// </summary>
    public required int step;

    /// <summary>
    /// Current state. 0-based
    /// </summary>
    public required int currentState;

    /// <summary>
    /// Action to be taken from <see cref="StepContext.currentState"/>
    /// </summary>
    public required int actionToTake;
}

public class ActionResults
{
    /// <summary>
    /// Reward if <see cref="StepContext.actionToTake"/> was taken
    /// from <see cref="StepContext.currentState"/>
    /// </summary>
    public required double reward;

    /// <summary>
    /// If true will stop after performing the action.
    /// </summary>
    public required bool gameOver;

    /// <summary>
    /// Next state after performing <see cref="StepContext.actionToTake"/>
    /// from <see cref="StepContext.currentState"/>
    /// </summary>
    public required int nextState;
}