namespace Neurons.QLearning;

public class QLearning
{
    private int noOfStates;
    private int noOfActions;
    private double[][] table = [];
    private CancellationTokenSource? tknCtx;

    #region EVENTS
    public event EventHandler? TrainingStopped;
    public event EventHandler<double[][]>? TrainingFinished;

    /// <summary>
    /// Get notified when a game is finished. Event arguments include the actions taken
    /// during the game
    /// </summary>
    public event EventHandler<int[]>? GameFinished;
    #endregion

    public void Train(TrainParameters p)
    {
        tknCtx?.Cancel();
        tknCtx?.Dispose();
        tknCtx = new();

        Task.Run(() => Train(p, tknCtx.Token));
    }

    public void StopTraining() => tknCtx?.Cancel();


    private async Task Train(TrainParameters p, CancellationToken token)
    {
        noOfActions = p.noOfActions;
        noOfStates = p.noOfStates;
        table = p.qTable ?? BuildTable();

        var stopped = false;
        var greediness = 0.0;
        var greedinessRate = 1d / p.iterations;

        for (var i = 0; i < p.iterations; i++)
        {
            if (token.IsCancellationRequested)
            {
                stopped = true;
                TrainingStopped?.Invoke(this, EventArgs.Empty);
                break;
            }

            greediness += greedinessRate;
            var state = p.initialState;
            var period = -1;

            var actions = new List<int>();

            while (true)
            {
                period++;

                var action = Random.Shared.NextDouble() < greediness ?
                    BestAction(state) : Random.Shared.Next(noOfActions);

                var res = p.Act(new()
                {
                    actionToTake = action,
                    currentState = state,
                    period = period
                });

                actions.Add(action);

                var currentQ = table[state][action];
                double nxtMaxQ = table[res.nextState].Max(); // max Q value from next state
                var qValue = currentQ + p.alpha * (res.reward + p.lambda * nxtMaxQ - currentQ);
                table[state][action] = qValue;

                if (res.gameOver) break;
            }

            GameFinished?.Invoke(this, [.. actions]);
        }

        if (!stopped) TrainingFinished?.Invoke(this, table);
    }

    private double[][] BuildTable()
    {
        var qTable = new double[noOfStates][];

        for (var i = 0; i < noOfStates; i++)
            qTable[i] = new double[noOfActions];

        return qTable;
    }

    private int BestAction(int state)
    {
        int maxIdx = 0;

        for (var i = 1; i < noOfActions; i++)
        {
            if (table[state][i] > table[state][maxIdx])
                maxIdx = i;
        }

        return maxIdx;
    }
}

// Q(s, a) = Q(s, a) + alpha[ r + ymax(s`, a`) - Q(s, a) ]