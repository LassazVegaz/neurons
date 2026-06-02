using Neurons.Network;

namespace Neurons.DQN;

public class DQN
{
    /// <summary>
    /// Perform action
    /// </summary>
    Func<PeriodContext, ActionResults>? act;
    /// <summary>
    /// Layers. Each element represents number of neurons in the layer
    /// </summary>
    int[] layers = [];
    /// <summary>
    /// Total number of actions allowed
    /// </summary>
    int noOfActions;
    double alpha;
    /// <summary>
    /// Thetas in the current/online DNN
    /// </summary>
    Thetas learningT = new() { b = [], w = [] };
    /// <summary>
    /// Token source used to cancel training in the middle
    /// </summary>
    CancellationTokenSource? tknCtx;

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
        if (act == null)
            throw new Exception("Act cannot be null");

        var p = new Predictor(t, layers);
        var actions = new List<int>();
        var totalRewards = 0.0;
        var s = initialState;

        for (var i = 0; i < maxPeriods; i++)
        {
            var prediction = p.Forward(s);
            var a = NextAction(prediction, true);
            var res = act(new() { actionToTake = a, currentState = s, period = i });

            actions.Add(a);
            totalRewards += res.reward;

            if (res.gameOver) break;

            s = res.nextState;
        }

        return new()
        {
            actions = [.. actions],
            iteration = 0,
            totalRewards = totalRewards,
            initialState = initialState
        };
    }


    private void Train(TrainParameters p, CancellationToken token)
    {
        noOfActions = p.noOfActions;
        alpha = p.alpha;
        learningT = p.t;
        act = p.act;
        layers = p.layers;

        var optimizer = new Optimizer(layers, learningT, alpha);
        var learningP = new Predictor(learningT, layers);
        var targetP = new Predictor(p.t.Clone(), layers);
        var stopped = false;

        var greediness = 0.0;
        var gRate = 1 / p.iterations;
        var s = p.initialState;

        for (var i = 0; i < p.iterations; i++)
        {
            if (token.IsCancellationRequested)
            {
                TrainingStopped?.Invoke(this, EventArgs.Empty);
                stopped = true;
                break;
            }

            greediness += gRate;
            s = p.initialState;

            var actions = new List<int>();
            var totalRewards = 0.0;
            var initialState = s;
            var experiences = new Experience[p.maxPeriods]; // replay buffer

            for (var j = 0; j < p.maxPeriods; j++)
            {
                // predict Q values for the state
                var predicted = learningP.Forward(s);
                // do the next action
                var a = NextAction(predicted,
                    !p.noGreedy && Random.Shared.NextDouble() < greediness);
                var actRes = p.act(new() { actionToTake = a, currentState = s, period = j });
                actions.Add(a);
                totalRewards += actRes.reward;

                // start calculating target Q value
                var targetQ = actRes.reward;
                // accumulate possible future reward
                if (!actRes.gameOver)
                    targetQ += p.lambda * MaxQ(targetP, actRes.nextState);

                // store experiences
                experiences[j] = new(predicted, a, targetQ);

                if (actRes.gameOver)
                {
                    s = p.initialState;
                    break;
                }
                else
                    s = actRes.nextState;
            }

            optimizer.Optimize(experiences);

            if ((i + 1) % p.batchSize == 0)
                targetP.t = learningT.Clone();

            RaiseGameFinished(actions, initialState, i, totalRewards);
        }

        if (!stopped)
            TrainingFinished?.Invoke(this, learningT);
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
        bestAction ? GetBestAction(res) : Random.Shared.Next(noOfActions);

    private void RaiseGameFinished(List<int> actions, double[] initialState, int i,
        double totalRewards)
        => GameFinished?.Invoke(this, new()
        {
            actions = [.. actions],
            initialState = initialState,
            iteration = i,
            totalRewards = totalRewards
        });
}
