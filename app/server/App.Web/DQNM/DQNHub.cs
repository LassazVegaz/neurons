using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.DQN;
using Neurons.Network;

namespace App.Web.DQNM;


public interface IDQNClient
{
    Task TrainingStopped();
    Task TrainingFinished(GameResults bestGame);
    Task GameFinished(GameResults gameResults);
}

public class DQNHub(DQN dqn, ActionPerformer performer, Storage storage,
    EventsListener listener, IOptions<DQNSettings> settings)
    : Hub<IDQNClient>
{
    readonly DQN _dqn = dqn;
    readonly ActionPerformer _performer = performer;
    readonly Storage _storage = storage;
    readonly EventsListener _listener = listener;
    readonly DQNSettings _settings = settings.Value;


    public override Task OnConnectedAsync()
    {
        Console.WriteLine("User connected: " + Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine("User disconnected: " + Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }


    public async Task StartTraining(HubTrainingParameters p)
    {
        _listener.SetIterations(p.Iterations);

        var thetas = await GetThetas(p);

        _dqn.Train(new()
        {
            act = _performer.Act,
            alpha = p.Alpha,
            initialState = [0, 0],
            iterations = p.Iterations,
            lambda = p.Lambda,
            layers = p.Layers,
            maxPeriods = Constants.MAX_PERIODS,
            noOfActions = Constants.NO_OF_ACTIONS,
            batchSize = _settings.BatchSize,
            t = thetas
        });
    }

    public void StopTraining() => _dqn.StopTraining();


    private async Task<Thetas> GetThetas(HubTrainingParameters p)
    {
        Thetas t;

        if (p.CreateNewThetas)
            t = ThetasInitializations.HeInitialization(p.Layers);
        else
            t = (await _storage.GetModel())?.thetas
                ?? ThetasInitializations.HeInitialization(p.Layers);

        await _storage.SaveModel(new()
        {
            alpha = p.Alpha,
            iterations = p.Iterations,
            lambda = p.Lambda,
            layers = p.Layers,
            thetas = t
        });

        return t;
    }
}
