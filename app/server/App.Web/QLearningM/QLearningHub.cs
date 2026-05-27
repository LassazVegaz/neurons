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
}

public interface IQlearningClient
{
    Task GameFinished(int[] actions);
}

public class QLearningHub : Hub<IQlearningClient>
{
    readonly QLearning _qLearning;
    readonly QLearningSettings _settings;
    readonly QLearningEventsListener _listener;


    public QLearningHub(QLearning qLearning, IOptions<QLearningSettings> settings,
        QLearningEventsListener eventsListener)
    {
        _qLearning = qLearning;
        _settings = settings.Value;
        _listener = eventsListener;
    }

    public async Task Train(HubTrainParameters p)
    {
        var qTable = p.CreateNewTable ? null : await GetSavedTable();

        _qLearning.Train(new()
        {
            Act = _listener.Act,
            alpha = p.Alpha,
            lambda = p.Lambda,
            initialState = 0,
            iterations = _settings.Iterations,
            noOfActions = Constants.ACTIONS,
            noOfStates = Constants.STATES,
            qTable = qTable
        });
    }


    async Task<double[][]?> GetSavedTable()
    {
        var fileName = Path.Combine(Environment.CurrentDirectory, _settings.QTableFile);
        if (!File.Exists(fileName)) return null;

        var json = await File.ReadAllTextAsync(fileName);
        return JsonSerializer.Deserialize<double[][]>(json);
    }
}

/**
 * 
 * ACTIONS: up, right, down, left
 * 
 */