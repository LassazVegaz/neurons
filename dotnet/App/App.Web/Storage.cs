using App.Shared;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace App.Web;

public class Storage(IOptions<AppSettings> options)
{
    readonly string modelFile = options.Value.ModelFileName;
    readonly string dataFile = options.Value.DataFileName;


    public bool ModelFileExists() => FileExists(modelFile);
    public async Task<Model> GetModel() => await GetJson<Model>(modelFile);
    public async Task SaveModel(Model m) => await SaveJson(m, modelFile);

    public bool DataFileExists() => FileExists(dataFile);
    public async Task<double[]> GetTrainingData() => await GetJson<double[]>(dataFile);
    public async Task SaveTrainingData(double[] d) => await SaveJson(d, dataFile);


    private static async Task<T> GetJson<T>(string fileName)
    {
        var fullFileName = Path.Combine(Environment.CurrentDirectory, fileName);
        var fileContent = await File.ReadAllTextAsync(fullFileName);
        return JsonSerializer.Deserialize<T>(fileContent)
            ?? throw new Exception("JSON cannot be null");
    }

    private static async Task SaveJson(object o, string fileName)
    {
        var fullFileName = Path.Combine(Environment.CurrentDirectory, fileName);
        var json = JsonSerializer.Serialize(o);
        await File.WriteAllTextAsync(fullFileName, json);
    }

    private static bool FileExists(string fileName) =>
        File.Exists(Path.Combine(Environment.CurrentDirectory, fileName));
}
