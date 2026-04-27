using System.Text.Json;

namespace Neurons.App.Console;

internal static class Storage
{
    private const string MODEL_FILE = "model.json";
    private const string TRAINING_DATA_FILE = "training-data.json";

    private static string FullModelFileName =>
        Path.Combine(Environment.CurrentDirectory, MODEL_FILE);

    public static bool ModelExists() => File.Exists(FullModelFileName);


    private static string FullTrainingDataFileName =>
        Path.Combine(Environment.CurrentDirectory, TRAINING_DATA_FILE);

    public static bool TrainingDataFileExists => File.Exists(FullTrainingDataFileName);


    public static async Task SaveModel(Model model)
    {
        var content = JsonSerializer.Serialize(model);
        await File.WriteAllTextAsync(FullModelFileName, content);
    }

    public static async Task<Model?> GetModel()
    {
        var content = await File.ReadAllTextAsync(FullModelFileName);
        return JsonSerializer.Deserialize<Model>(content);
    }


    public static async Task SaveTrainingData(double[] data)
    {
        var content = JsonSerializer.Serialize(data);
        await File.WriteAllTextAsync(FullTrainingDataFileName, content);
    }

    public static async Task<double[]?> GetTrainingData()
    {
        var content = await File.ReadAllTextAsync(FullTrainingDataFileName);
        return JsonSerializer.Deserialize<double[]>(content);
    }
}