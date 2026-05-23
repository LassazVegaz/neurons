using App.Shared;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons;

namespace App.Web.Hubs;

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
    MSECalculator mseCalculator, Function func) : Hub<INetworkClient>
{
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
        if (!_storage.DataFileExists())
            await _storage.SaveTrainingData(MakeTrainingData());
        var inputs = await _storage.GetTrainingData();

        if (!_storage.ModelFileExists())
            await _storage.SaveModel(BuildModel(inputs, p.Layers));
        var model = await _storage.GetModel();

        _mseCal.SetData(new()
        {
            M = inputs.Length,
            TotalIterations = p.Iterations
        });

        _network.Train(new()
        {
            alpha = p.Alpha,
            f = f,
            iterationsCount = p.Iterations,
            layers = p.Layers,
            normParams = model.normParams,
            inputs = inputs,
            t = model.thetas
        });
    }

    public async Task StopTraining()
    {
        _network.StopTraining();
    }


    private static Model BuildModel(double[] trainingData, int[] layers)
    {
        var mean = trainingData.Average();
        var sum = trainingData.Sum(d => Math.Pow(d - mean, 2));
        var std = Math.Sqrt(sum / trainingData.Length);

        return new()
        {
            normParams = new()
            {
                mean = mean,
                standardDeviation = std
            },
            thetas = ThetasInitializations.HeInitialization(layers)
        };
    }

    private double[] MakeTrainingData()
    {
        var data = new double[settings.TrainingDataCount];

        for (var i = 0; i < settings.TrainingDataCount; i++)
            data[i] = Random.Shared.NextDouble() * settings.TrainingDataCount;

        return data;
    }
}
