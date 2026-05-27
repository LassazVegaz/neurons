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
}