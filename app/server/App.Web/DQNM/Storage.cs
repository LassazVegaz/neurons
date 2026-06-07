using Microsoft.Extensions.Options;
using Neurons.Network;
using System.Text.Json;

namespace App.Web.DQNM;

public class Storage(IOptions<DQNSettings> settings)
{
    readonly string modelFile = settings.Value.ModelFile;
    readonly string lastUsedParamsFile = settings.Value.LastUsedParamsFile;
    readonly JsonSerializerOptions jsonOps = new()
    {
        IncludeFields = true
    };


    public async Task SaveThetas(Thetas t) => await SaveJson(modelFile, t);

    public async Task<Thetas?> GetThetas() => await GetJson<Thetas>(modelFile);

    public async Task SaveLastUsedParams(LastUsedParams p)
        => await SaveJson(lastUsedParamsFile, p);

    public async Task<LastUsedParams?> GetLastUsedParams()
        => await GetJson<LastUsedParams>(lastUsedParamsFile);


    private async Task SaveJson(string fileName, object o)
    {
        var fullFileName = Path.Combine(Environment.CurrentDirectory, fileName);
        var json = JsonSerializer.Serialize(o, jsonOps);
        await File.WriteAllTextAsync(fullFileName, json);
    }

    private async Task<T?> GetJson<T>(string fileName)
    {
        var fullFileName = Path.Combine(Environment.CurrentDirectory, fileName);
        if (!File.Exists(fullFileName)) return default;

        var json = await File.ReadAllTextAsync(fullFileName);
        return JsonSerializer.Deserialize<T>(json, jsonOps);
    }
}
