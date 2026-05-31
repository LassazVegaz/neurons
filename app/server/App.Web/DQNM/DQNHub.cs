using Microsoft.AspNetCore.SignalR;
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
    EventsListener listener)
    : Hub<IDQNClient>
{
    readonly DQN _dqn = dqn;
    readonly ActionPerformer _performer = performer;
    readonly Storage _storage = storage;
    readonly EventsListener _listener = listener;


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

        var thetas = await GetThetas(p.CreateNewThetas, p.Layers);

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
            t = thetas
        });
    }

    public void StopTraining() => _dqn.StopTraining();


    private async Task<Thetas> GetThetas(bool newThetas, int[] layers)
    {
        if (newThetas)
            return ThetasInitializations.HeInitialization(layers);
        else
            return await _storage.GetModel()
                ?? ThetasInitializations.HeInitialization(layers);
    }
}
