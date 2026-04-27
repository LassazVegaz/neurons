using System.Text.Json;

namespace Neurons.App.Console;

internal static class Tools
{
    private const string MODEL_FILE = "model.json";

    private static string FullModelFileName =>
        Path.Combine(Environment.CurrentDirectory, MODEL_FILE);


    public static double GetStandardDeviation(double[] numbers)
    {
        var avg = numbers.Average();
        var sum = numbers.Sum(d => Math.Pow(d - avg, 2));
        return Math.Sqrt(sum / numbers.Length);
    }

    public static async Task SaveModelAsync(Model model)
    {
        var content = JsonSerializer.Serialize(model);
        await File.WriteAllTextAsync(FullModelFileName, content);
    }

    public static async Task<Model?> GetModel()
    {
        var content = await File.ReadAllTextAsync(FullModelFileName);
        return JsonSerializer.Deserialize<Model>(content);
    }

    public static bool ModelExists() => File.Exists(FullModelFileName);
}

internal class Model
{
    public required NormalizationParameters normParams;
    public required Thetas thetas;
}