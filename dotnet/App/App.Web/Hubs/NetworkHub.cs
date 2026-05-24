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
        var tData = await _storage.GetTrainingData();

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

    private TrainingData MakeTrainingData()
    {
        var x = new double[settings.TrainingDataCount]
            .Select((_) =>
            {
                var sign = Random.Shared.NextDouble() > 0.5 ? -1 : 1;
                return Random.Shared.NextDouble() * settings.TrainingDataCount * sign;
            })
            .Order()
            .ToArray();
        var xNormParams = Normalization.GetNormalizationParameters(x);
        var xNorm = x.Select(x => Normalization.Normalize(x, xNormParams))
                     .ToArray();

        var y = x.Select(x => f(x))
                 .ToArray();
        var yNormParams = Normalization.GetNormalizationParameters(y);
        var yNorm = y.Select(y => Normalization.Normalize(y, yNormParams))
                     .ToArray();

        return new()
        {
            x = x,
            xNormParams = xNormParams,
            xNorm = xNorm,

            y = y,
            yNormParams = yNormParams,
            yNorm = yNorm
        };
    }
}
