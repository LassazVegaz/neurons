using Microsoft.Extensions.Configuration;
using Neurons;
using Neurons.App.Console;

const string LOCAL_APPSETTINGS_FILE = "appsettings.local.json";

var configs = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile(LOCAL_APPSETTINGS_FILE, true, true)
    .Build();

var iterations = int.Parse(configs["Iterations"]
    ?? throw new Exception("Iterations not found in appsettings"));

var f = (double x) => x;
int[] layers = [1, 2, 1];

var trainingData = await EssentialsBuilder.GetTrainingData();
var model = await EssentialsBuilder.GetModel(new()
{
    clearModel = configs["ClearModel"]?.ToLower() == "true",
    layers = layers,
    trainingData = trainingData
});

var network = new Network(new()
{
    layers = layers,
    f = f,
    alpha = 0.1,
    normParams = model.normParams,
    iterationsCount = iterations
});

MSECalculator.LogMse(new()
{
    f = f,
    iterationsCount = iterations,
    m = trainingData.Length,
    network = network
});

network.Train(trainingData, model.thetas);

await Storage.SaveModel(model);

var testData = new double[] { 1, 2, 100, 102.3698, 0.258 };
foreach (var x in testData)
{
    var p = network.Predict(x, model.thetas);
    Console.WriteLine($"when x = {x}, y = {f(x)}, prediction = {p}");
}