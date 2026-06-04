using Neurons.Network;

namespace Neurons.DQN;

public class DQN
{
    /// <summary>
    /// Token source used to cancel training in the middle
    /// </summary>
    CancellationTokenSource? tknCtx;
    TrainParameters p = null!;

    /// <summary>
    /// Get notified when a game is finished
    /// </summary>
    public event EventHandler<GameResults>? GameFinished;
    /// <summary>
    /// Get notified when the training has been stopped in the middle
    /// </summary>
    public event EventHandler? TrainingStopped;
    /// <summary>
    /// Get notified when training has finished succesfully
    /// </summary>
    public event EventHandler<Thetas>? TrainingFinished;


    public void Train(TrainParameters p)
    {
        tknCtx?.Cancel();
        tknCtx = new();

        Task.Run(() => Train(p, tknCtx.Token));
    }

    public void StopTraining() => tknCtx?.Cancel();

    public GameResults DoTheBest(Thetas t, double[] initialState, int maxPeriods)
    {
        var predictor = new Predictor(t, p.layers);
        var actions = new List<int>();
        var totalRewards = 0.0;
        var s = initialState;
        var states = new List<double[]> { s };

        for (var i = 0; i < maxPeriods; i++)
        {
            var prediction = predictor.Forward(s);
            var a = NextAction(prediction, true);
            var res = p.act(new() { actionToTake = a, currentState = s, period = i });

            actions.Add(a);
            totalRewards += res.reward;
            states.Add(res.nextState);

            if (res.gameOver) break;

            s = res.nextState;
        }

        return new()
        {
            states = [.. states],
            actions = [.. actions],
            iteration = 0,
            totalRewards = totalRewards
        };
    }


    private void Train(TrainParameters p, CancellationToken token)
    {
        this.p = p;

        var optimizer = new Optimizer(p.layers, p.t, p.alpha);
        var learningP = new Predictor(p.t, p.layers);
        var targetP = new Predictor(p.t.Clone(), p.layers);
        var stopped = false;

        var gRate = 1 / p.replayBufferSize;

        for (var i = 0; i < p.iterations; i++)
        {
            if (token.IsCancellationRequested)
            {
                TrainingStopped?.Invoke(this, EventArgs.Empty);
                stopped = true;
                break;
            }

            var greediness = 0.0;
            var experiences = new List<Experience>(); // replay buffer
            var replayBuffLastIdx = p.replayBufferSize - 1;

            for (var j = 0; j < p.replayBufferSize; j++)
            {
                greediness += gRate;

                var s = p.initialState;
                var actions = new List<int>();
                var states = new List<double[]> { s };
                var totalRewards = 0.0;
                var raiseEvent = j == replayBuffLastIdx;

                for (var k = 0; k < p.maxPeriods; k++)
                {
                    // predict Q values for the state
                    var predicted = learningP.Forward(s);
                    // do the next action
                    var a = NextAction(predicted,
                        !p.noGreedy && Random.Shared.NextDouble() < greediness);
                    var actRes = p.act(new()
                    {
                        actionToTake = a,
                        currentState = s,
                        period = k
                    });

                    if (raiseEvent)
                    {
                        actions.Add(a);
                        totalRewards += actRes.reward;
                        states.Add(actRes.nextState);
                    }

                    // start calculating target Q value
                    var targetQ = actRes.reward;
                    // accumulate possible future reward
                    if (!actRes.gameOver)
                        targetQ += p.lambda * MaxQ(targetP, actRes.nextState);

                    // store experiences
                    experiences.Add(new(predicted, a, targetQ));

                    if (actRes.gameOver) break;
                    s = actRes.nextState;
                }

                if (raiseEvent)
                    RaiseGameFinished(states, actions, i, totalRewards);
            }

            optimizer.Optimize([.. experiences]);

            if ((i + 1) % p.networksSyncPeriod == 0)
                targetP.t = p.t.Clone();
        }

        if (!stopped)
            TrainingFinished?.Invoke(this, p.t);
    }

    private static int GetBestAction(ForwardResults forwardResults)
    {
        var qValues = forwardResults.befA[^1];
        var maxIdx = 0;

        for (var i = 1; i < qValues.Length; i++)
            if (qValues[i] > qValues[maxIdx]) maxIdx = i;

        return maxIdx;
    }

    private static double MaxQ(Predictor p, double[] s)
    {
        var res = p.Forward(s);
        return res.befA[^1].Max();
    }

    private int NextAction(ForwardResults res, bool bestAction) =>
        bestAction ? GetBestAction(res) : Random.Shared.Next(p.noOfActions);

    private void RaiseGameFinished(List<double[]> states, List<int> actions, int i,
        double totalRewards)
        => GameFinished?.Invoke(this, new()
        {
            states = [.. states],
            actions = [.. actions],
            iteration = i,
            totalRewards = totalRewards
        });
}
