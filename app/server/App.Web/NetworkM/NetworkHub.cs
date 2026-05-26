using App.Shared;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.Network;

namespace App.Web.NetworkM;

public record TrainingResult
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Prediction { get; set; }
}

public interface INetworkClient
{
    Task TrainingFinished(TrainingResult[] results);
    Task TrainingStopped();
    Task IterationBreak(int iteration, double[] MSEs);
}

public record TrainParams
{
    public required int[] Layers { get; set; }
    public bool NewThetas { get; set; }
    public double Alpha { get; set; }
    public int Iterations { get; set; }
}

public class NetworkHub(Network network, Storage storage, IOptions<AppSettings> options,
    MSECalculator mseCalculator, Function func, TrainingDataCook cook) : Hub<INetworkClient>
{
    readonly TrainingDataCook _cook = cook;
    readonly Network _network = network;
    readonly Storage _storage = storage;
    readonly MSECalculator _mseCal = mseCalculator;
    readonly AppSettings settings = options.Value;
    readonly Func<double, double> f = func.f;


    public override Task OnConnectedAsync()
    {
        Console.WriteLine("A user connected: " + Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine("A user disconnected: " + Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }


    public async Task Train(TrainParams p)
    {
        var tData = await GetTrainingData();

        if (p.NewThetas || !_storage.ModelFileExists())
            await _storage.SaveModel(BuildModel(p.Layers));
        var model = await _storage.GetModel();

        _mseCal.SetData(new()
        {
            M = tData.x.Length,
            TotalIterations = p.Iterations
        });

        _network.Train(new()
        {
            alpha = p.Alpha,
            f = f,
            iterationsCount = p.Iterations,
            layers = p.Layers,
            inputs = tData.xNorm,
            targets = tData.yNorm,
            t = model.thetas
        });
    }

    public async Task StopTraining()
    {
        _network.StopTraining();
    }


    private static Model BuildModel(int[] layers) => new()
    {
        thetas = ThetasInitializations.HeInitialization(layers)
    };

    private async Task<TrainingData> GetTrainingData()
    {
        TrainingData tData;
        var saveData = false;

        if (!_storage.DataFileExists())
        {
            tData = _cook.MakeTrainingData();
            saveData = true;
        }
        else
        {
            tData = await _storage.GetTrainingData();
            if (!_cook.AreXYValid(tData.x, tData.y))
            {
                tData = _cook.MakeTrainingData();
                saveData = true;
            }
        }

        if (saveData) await _storage.SaveTrainingData(tData);

        return tData;
    }
}
