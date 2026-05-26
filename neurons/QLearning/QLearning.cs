namespace Neurons.QLearning;

public class QLearning
{
    private int noOfStates;
    private int noOfActions;
    private double[][] table = [];
    private CancellationTokenSource? tknCtx;

    public event EventHandler? TrainingStopped;
    public event EventHandler? TrainingFinished;

    public void Train(TrainParameters p)
    {
        tknCtx?.Cancel();
        tknCtx = new();

        Task.Run(() => Train(p, tknCtx.Token));
    }


    private async Task Train(TrainParameters p, CancellationToken token)
    {
        noOfActions = p.noOfActions;
        noOfStates = p.noOfStates;
        table = BuildTable();

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
            var step = -1;

            while (true)
            {
                step++;

                var action = Random.Shared.NextDouble() < greediness ?
                    BestAction(state) : Random.Shared.Next(noOfActions);

                var res = p.Act(new()
                {
                    actionToTake = action,
                    currentState = state,
                    step = step
                });

                var currentQ = table[state][action];
                double nxtMaxQ = table[res.nextState].Max(); // max Q value fron next state
                var qValue = currentQ + p.alpha * (res.reward + p.lambda * nxtMaxQ - currentQ);
                table[state][action] = qValue;

                if (res.gameOver) break;
            }
        }

        if (!stopped) TrainingFinished?.Invoke(this, EventArgs.Empty);
    }

    private double[][] BuildTable()
    {
        var table = new double[noOfStates][];

        for (var i = 0; i < noOfStates; i++)
            table[i] = new double[noOfActions];

        return table;
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