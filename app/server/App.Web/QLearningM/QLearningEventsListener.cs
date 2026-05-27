using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.QLearning;

namespace App.Web.QLearningM;

public class TrainData
{
    public required int iterations;
}

public class QLearningEventsListener
{
    readonly QLearning _qLearning;
    readonly QLearningSettings _settings;
    readonly IHubContext<QLearningHub, IQlearningClient> _hub;
    readonly double[] rewards = MakeRewards();

    double step;
    double accumulator;
    int iterationIdx;
    int lastIterationIdx;


    public QLearningEventsListener(QLearning qLearning, IOptions<QLearningSettings> settings,
        IHubContext<QLearningHub, IQlearningClient> hub)
    {
        _qLearning = qLearning;
        _settings = settings.Value;
        _hub = hub;

        _qLearning.PeriodFinished += QLearning_StepFinished;
        _qLearning.TrainingStopped += QLearning_TrainingStopped;
        _qLearning.TrainingFinished += QLearning_TrainingFinished;
    }

    public ActionResults Act(PeriodContext ctx)
    {
        var s = ctx.currentState;
        var a = ctx.actionToTake;
        var nextState = s;

        if (a == 0 && s > 9) nextState -= 10;
        else if (a == 1 && s % 10 != 9) nextState++;
        else if (a == 2 && s < 89) nextState += 10;
        else if (a == 3 && s % 10 != 0) nextState--;

        return new()
        {
            nextState = nextState,
            gameOver = ctx.period == Constants.ALLOWED_STEPS,
            reward = rewards[nextState]
        };
    }

    public void SetTrainData(TrainData p)
    {
        var gamesToSend = Math.Min(p.iterations, _settings.MaxGamesToSend);
        step = (double)gamesToSend / p.iterations;
        accumulator = 0;
        iterationIdx = 0;
        lastIterationIdx = p.iterations - 1;
    }


    void QLearning_StepFinished(object? sender, int[] actions)
    {
        accumulator += step;

        if (accumulator >= 1.0 || iterationIdx == 0 || iterationIdx == lastIterationIdx)
        {
            accumulator--;

            _hub.Clients.All.GameFinished(actions);
        }
    }

    void QLearning_TrainingFinished(object? sender, double[][] e)
    {
        throw new NotImplementedException();
    }

    void QLearning_TrainingStopped(object? sender, EventArgs e)
    {
        throw new NotImplementedException();
    }

    static double[] MakeRewards()
    {
        var r = new double[Constants.STATES];

        for (var i = 0; i < Constants.STATES; i++)
        {
            var col = (i % 10) + 1;
            var row = (i / 10) + 1;
            r[i] = 10 - Math.Sqrt(Math.Pow(10 - col, 2) + Math.Pow(10 - row, 2));
        }

        return r;
    }
}

/**
 * 
 * ACTIONS: up, right, down, left
 * 
 */
