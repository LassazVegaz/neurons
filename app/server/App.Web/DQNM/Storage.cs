using Microsoft.Extensions.Options;
using Neurons.Network;
using System.Text.Json;

namespace App.Web.DQNM;

public class Storage(IOptions<DQNSettings> settings)
{
    readonly string modelFile = settings.Value.ModelFile;
    readonly JsonSerializerOptions jsonOps = new()
    {
        IncludeFields = true
    };


    public async Task SaveModel(Thetas t)
    {
        var fileName = Path.Combine(Environment.CurrentDirectory, modelFile);
        var json = JsonSerializer.Serialize(t, jsonOps);
        await File.WriteAllTextAsync(fileName, json);
    }

    public async Task<Thetas?> GetModel()
    {
        var fullFileName = Path.Combine(Environment.CurrentDirectory, modelFile);
        if (!File.Exists(fullFileName)) return null;

        var json = await File.ReadAllTextAsync(fullFileName);
        return JsonSerializer.Deserialize<Thetas>(json, jsonOps);
    }
}
