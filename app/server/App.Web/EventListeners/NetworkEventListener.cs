using App.Web.Hubs;
using Microsoft.AspNetCore.SignalR;
using Neurons;

namespace App.Web.EventListeners;

public class NetworkEventListener
{
    readonly Network _network;
    readonly IHubContext<NetworkHub, INetworkClient> _hub;
    readonly Func<double, double> f;
    readonly Storage _storage;


    public NetworkEventListener(Network network, IHubContext<NetworkHub, INetworkClient> networkHub,
        Function _func, Storage storage)
    {
        _network = network;
        _hub = networkHub;
        _storage = storage;
        f = _func.f;

        network.TrainingStopped += Network_TrainingStopped;
        network.TrainingFinished += Network_TrainingFinished;
    }

    private async void Network_TrainingStopped(object? sender, EventArgs e)
    {
        await _hub.Clients.All.TrainingStopped();
    }

    private async void Network_TrainingFinished(object? sender, Thetas t)
    {
        await SaveThetas(t);

        var trainingData = await _storage.GetTrainingData();
        var results = new TrainingResult[trainingData.x.Length];

        for (var i = 0; i < results.Length; i++)
        {
            var pNorm = _network.Predict(trainingData.xNorm[i], t);

            results[i] = new()
            {
                X = trainingData.x[i],
                Y = trainingData.y[i],
                Prediction = Normalization.Denormalize(pNorm, trainingData.yNormParams)
            };
        }

        await _hub.Clients.All.TrainingFinished(results);
    }

    private async Task SaveThetas(Thetas t)
    {
        var lastSaved = await _storage.GetModel();
        lastSaved.thetas = t;
        await _storage.SaveModel(lastSaved);
    }
}
