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
    MSECalculator mseCalculator) : Hub<INetworkClient>
{
    readonly Network _network = network;
    readonly Storage _storage = storage;
    readonly MSECalculator _mseCal = mseCalculator;
    readonly AppSettings settings = options.Value;


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

        _network.Train(inputs, model.thetas);
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
            thetas = ThetasInitializations.ZeroInitialization(layers)
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
