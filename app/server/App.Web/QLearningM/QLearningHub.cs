using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.QLearning;
using System.Text.Json;

namespace App.Web.QLearningM;

public class HubTrainParameters
{
    public double Alpha { get; set; }
    public double Lambda { get; set; }
    public bool CreateNewTable { get; set; }
    public int Iterations { get; set; }
}

public interface IQlearningClient
{
    Task GameFinished(int[] actions);
    Task TrainingStopped();
    Task TrainingFinished();
}

public class QLearningHub(QLearning qLearning, IOptions<QLearningSettings> settings,
    QLearningEventsListener eventsListener, ActionPerformer actionPerformer)
    : Hub<IQlearningClient>
{
    readonly QLearning _qLearning = qLearning;
    readonly QLearningSettings _settings = settings.Value;
    readonly QLearningEventsListener _listener = eventsListener;
    readonly ActionPerformer _actionPerformer = actionPerformer;

    public async Task Train(HubTrainParameters p)
    {
        _listener.SetTrainData(new() { iterations = p.Iterations });

        var qTable = p.CreateNewTable ? null : await GetSavedTable();

        _qLearning.Train(new()
        {
            Act = _actionPerformer.Act,
            alpha = p.Alpha,
            lambda = p.Lambda,
            initialState = 0,
            iterations = _settings.Iterations,
            noOfActions = Constants.ACTIONS,
            noOfStates = Constants.STATES,
            qTable = qTable
        });
    }

    public void StopTraining() => _qLearning.StopTraining();


    async Task<double[][]?> GetSavedTable()
    {
        var fileName = Path.Combine(Environment.CurrentDirectory, _settings.QTableFile);
        if (!File.Exists(fileName)) return null;

        var json = await File.ReadAllTextAsync(fileName);
        return JsonSerializer.Deserialize<double[][]>(json);
    }
}