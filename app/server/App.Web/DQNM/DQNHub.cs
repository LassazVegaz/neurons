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
        await SaveParams(p);

        _listener.SetIterations(p.Iterations);

        var thetas = await GetThetas(p.CreateNewThetas, p.Layers);

        _dqn.Train(new()
        {
            act = _performer.Act,
            alpha = p.Alpha,
            initialState = Constants.InitialState,
            iterations = p.Iterations,
            lambda = p.Lambda,
            layers = p.Layers,
            maxPeriods = Constants.MAX_PERIODS,
            noOfActions = Constants.NO_OF_ACTIONS,
            noGreedy = p.NoGreedy,
            replayBufferSize = _settings.ReplayBufferSize,
            networksSyncPeriod = _settings.NetworksSyncPeriod,
            t = thetas
        });
    }

    public void StopTraining() => _dqn.StopTraining();

    public async Task<LastUsedParams?> GetLastUsedParams()
        => await _storage.GetLastUsedParams();

    public async Task<GameResults?> GetTheBestGame()
    {
        var t = await _storage.GetThetas();
        var p = await _storage.GetLastUsedParams();
        if (t == null || p == null) return null;

        if (!_dqn.ParametersAreSet)
            _dqn.Parameters = new()
            {
                act = _performer.Act,
                alpha = p.Alpha,
                initialState = Constants.InitialState,
                iterations = p.Iterations,
                lambda = p.Lambda,
                layers = p.Layers,
                maxPeriods = Constants.MAX_PERIODS,
                networksSyncPeriod = _settings.NetworksSyncPeriod,
                noGreedy = p.NoGreedy,
                noOfActions = Constants.NO_OF_ACTIONS,
                replayBufferSize = _settings.ReplayBufferSize,
                t = t
            };

        var bestShot = _dqn.DoTheBest(t, Constants.InitialState, Constants.MAX_PERIODS);
        return new()
        {
            Actions = bestShot.actions,
            States = Normalization.DenormalizeStates(bestShot.states),
            Iteration = bestShot.iteration,
            TotalRewards = bestShot.totalRewards
        };
    }


    private async Task<Thetas> GetThetas(bool newThetas, int[] layers)
    {
        Thetas t;

        if (newThetas)
            t = ThetasInitializations.HeInitialization(layers);
        else
            t = (await _storage.GetThetas())
                ?? ThetasInitializations.HeInitialization(layers);

        return t;
    }

    private async Task SaveParams(HubTrainingParameters p)
        => await _storage.SaveLastUsedParams(new()
        {
            Alpha = p.Alpha,
            Iterations = p.Iterations,
            Lambda = p.Lambda,
            Layers = p.Layers,
            NoGreedy = p.NoGreedy
        });
}
