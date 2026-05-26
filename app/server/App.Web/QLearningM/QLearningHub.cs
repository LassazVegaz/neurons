using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.QLearning;
using System.Text.Json;

namespace App.Web.QLearningM;

public class HubTrainParameters
{
    public double Alpha { get; set; }
}

public class QLearningHub(QLearning qLearning, IOptions<QLearningSettings> settings)
    : Hub
{
    const int ALLOWED_STEPS = 9; // 0-based
    const int STATES = 100;
    const int ACTIONS = 4;

    readonly QLearning _qLearning = qLearning;
    readonly QLearningSettings _settings = settings.Value;
    readonly double[] rewards = MakeRewards();

    public async Task Train(HubTrainParameters p)
    {
        _qLearning.Train(new()
        {
            Act = Act,
            alpha = p.Alpha,
            initialState = 0,
            iterations = _settings.Iterations,
            lambda = _settings.Lambda,
            noOfActions = ACTIONS,
            noOfStates = STATES,
            qTable = await GetSavedTable()
        });
    }


    ActionResults Act(ActionDetails ctx)
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
            gameOver = ctx.step == ALLOWED_STEPS,
            reward = rewards[nextState]
        };
    }

    async Task<double[][]?> GetSavedTable()
    {
        var fileName = Path.Combine(Environment.CurrentDirectory, _settings.QTableFile);
        if (!File.Exists(fileName)) return null;

        var json = await File.ReadAllTextAsync(fileName);
        return JsonSerializer.Deserialize<double[][]>(json);
    }

    static double[] MakeRewards()
    {
        var r = new double[STATES];

        for (var i = 0; i < STATES; i++)
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