using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.QLearning;
using System.Text.Json;

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
    int lastIterationIdx;


    public QLearningEventsListener(QLearning qLearning, IOptions<QLearningSettings> settings,
        IHubContext<QLearningHub, IQlearningClient> hub)
    {
        _settings = settings.Value;
        _hub = hub;

        qLearning.GameFinished += QLearning_GameFinished;
        qLearning.TrainingStopped += QLearning_TrainingStopped;
        qLearning.TrainingFinished += QLearning_TrainingFinished;
    }

    public void SetTrainData(TrainData p)
    {
        var gamesToSend = Math.Min(p.iterations, _settings.MaxGamesToSend);
        step = (double)gamesToSend / p.iterations;
        accumulator = 0;
        lastIterationIdx = p.iterations - 1;
    }


    void QLearning_GameFinished(object? sender, GameResults results)
    {
        accumulator += step;

        if (accumulator >= 1.0 || results.iteration == 0 ||
            results.iteration == lastIterationIdx)
        {
            accumulator--;

            _hub.Clients.All.GameFinished(results);
        }
    }

    async void QLearning_TrainingFinished(object? sender, double[][] qTable)
    {
        await SaveTable(qTable);
        await _hub.Clients.All.TrainingFinished();
    }

    void QLearning_TrainingStopped(object? sender, EventArgs e)
    {
        _hub.Clients.All.TrainingStopped();
    }

    async Task SaveTable(double[][] qTable)
    {
        var fileName = Path.Combine(Environment.CurrentDirectory, _settings.QTableFile);
        var json = JsonSerializer.Serialize(qTable);
        await File.WriteAllTextAsync(fileName, json);
    }
}