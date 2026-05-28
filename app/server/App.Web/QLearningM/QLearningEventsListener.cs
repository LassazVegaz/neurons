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
    readonly QLearningSettings _settings;
    readonly IHubContext<QLearningHub, IQlearningClient> _hub;

    double step;
    double accumulator;
    int iterationIdx;
    int lastIterationIdx;


    public QLearningEventsListener(QLearning qLearning, IOptions<QLearningSettings> settings,
        IHubContext<QLearningHub, IQlearningClient> hub)
    {
        _settings = settings.Value;
        _hub = hub;

        qLearning.PeriodFinished += QLearning_StepFinished;
        qLearning.TrainingStopped += QLearning_TrainingStopped;
        qLearning.TrainingFinished += QLearning_TrainingFinished;
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
        _hub.Clients.All.TrainingFinished();
    }

    void QLearning_TrainingStopped(object? sender, EventArgs e)
    {
        _hub.Clients.All.TrainingStopped();
    }
}