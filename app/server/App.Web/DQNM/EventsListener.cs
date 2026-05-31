using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.DQN;
using Neurons.Network;
using QLGameResults = Neurons.QLearning.GameResults;

namespace App.Web.DQNM;

public class EventsListener
{
    readonly IHubContext<DQNHub, IDQNClient> _hub;
    readonly DQN _dqn;
    readonly Storage _storage;
    readonly DQNSettings _settings;

    double step;
    double accumulator;
    int lastIterationIdx;


    public EventsListener(DQN dqn, IHubContext<DQNHub, IDQNClient> hub, Storage storage,
        IOptions<DQNSettings> settings)
    {
        _hub = hub;
        _dqn = dqn;
        _storage = storage;
        _settings = settings.Value;

        dqn.GameFinished += DQN_GameFinished;
        dqn.TrainingStopped += DQN_TrainingStopped;
        dqn.TrainingFinished += DQN_TrainingFinished;
    }

    public void SetIterations(int iterations)
    {
        var gamesToSend = Math.Min(iterations, _settings.MaxGamesToSend);
        step = (double)gamesToSend / iterations;
        accumulator = 0;
        lastIterationIdx = iterations - 1;
    }


    async void DQN_GameFinished(object? sender, QLGameResults res)
    {
        accumulator += step;

        if (accumulator >= 1 || res.iteration == 0 || res.iteration == lastIterationIdx)
        {
            accumulator--;

            await _hub.Clients.All.GameFinished(new()
            {
                Actions = res.actions,
                Iteration = res.iteration,
                TotalRewards = res.totalRewards
            });
        }
    }

    void DQN_TrainingStopped(object? sender, EventArgs e) =>
        _hub.Clients.All.TrainingStopped();

    async void DQN_TrainingFinished(object? sender, Thetas t)
    {
        var bestShot = _dqn.DoTheBest(t, [0, 0], Constants.MAX_PERIODS);
        await _hub.Clients.All.TrainingFinished(new()
        {
            Actions = bestShot.actions,
            Iteration = 0,
            TotalRewards = bestShot.totalRewards
        });

        await _storage.UpdateThetas(t);
    }
}
