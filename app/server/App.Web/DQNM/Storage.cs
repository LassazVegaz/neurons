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


    public async Task UpdateThetas(Thetas t)
    {
        var m = await GetModel()
            ?? throw new NullReferenceException("Model is null");
        m.thetas = t;
        await SaveModel(m);
    }

    public async Task SaveModel(Model m)
    {
        var fileName = Path.Combine(Environment.CurrentDirectory, modelFile);
        var json = JsonSerializer.Serialize(m, jsonOps);
        await File.WriteAllTextAsync(fileName, json);
    }

    public async Task<Model?> GetModel()
    {
        var fullFileName = Path.Combine(Environment.CurrentDirectory, modelFile);
        if (!File.Exists(fullFileName)) return null;

        var json = await File.ReadAllTextAsync(fullFileName);
        return JsonSerializer.Deserialize<Model>(json, jsonOps);
    }
}
