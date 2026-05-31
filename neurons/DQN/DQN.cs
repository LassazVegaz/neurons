using Neurons.Network;
using Neurons.QLearning;

namespace Neurons.DQN;

public class DQN()
{
    Func<PeriodContext, ActionResults>? act;
    int[] layers = [];
    int noOfActions;
    double alpha;
    Thetas learningT = new() { b = [], w = [] };
    CancellationTokenSource? tknCtx;

    public event EventHandler<GameResults>? GameFinished;
    public event EventHandler? TrainingStopped;
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
            totalRewards = totalRewards
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

        var eRate = (p.maxPeriods - 2.0) / p.iterations;
        var eStopsAt = -eRate;

        for (var i = 0; i < p.iterations; i++)
        {
            if (token.IsCancellationRequested)
            {
                TrainingStopped?.Invoke(this, EventArgs.Empty);
                stopped = true;
                break;
            }

            var s = p.initialState;
            var actions = new List<int>();
            var totalRewards = 0.0;

            eStopsAt += eRate;

            for (var j = 0; j < p.maxPeriods; j++)
            {
                // predict Q values for the state
                var predicted = learningP.Forward(s);
                // do the next action
                var a = NextAction(predicted, j < eStopsAt);
                var actRes = p.act(new() { actionToTake = a, currentState = s, period = j });
                actions.Add(a);
                totalRewards += actRes.reward;

                // start calculating target Q value
                var targetQ = actRes.reward;
                // accumulate possible future reward
                if (!actRes.gameOver)
                    targetQ += p.lambda * MaxQ(targetP, actRes.nextState);

                // optimize learning thetas
                optimizer.Optimize(predicted, targetQ, a);

                if (actRes.gameOver) break;
                s = actRes.nextState;
            }

            if (i % 50 == 0)
                targetP.t = learningT.Clone();

            RaiseGameFinished(actions, i, totalRewards);
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

    private void RaiseGameFinished(List<int> actions, int i, double totalRewards)
        => GameFinished?.Invoke(this, new()
        {
            actions = [.. actions],
            iteration = i,
            totalRewards = totalRewards
        });
}
