using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

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
    public int Iteration { get; set; }
}

public class NetworkHub : Hub<INetworkClient>
{
    public async Task Train(TrainParams p)
    {
        Console.WriteLine($"Train: {ToJson(p)}");
    }

    public async Task StopTraining()
    {
        Console.WriteLine("Stop training");
    }

    private static string ToJson(object o) => JsonSerializer.Serialize(o);
}
