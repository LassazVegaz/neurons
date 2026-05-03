using Neurons;
using Neurons.App.Console;

const int ITERATIONS_COUNT = 1000;

var f = (double x) => x;
int[] layers = [1, 1, 1];
double[] trainingData;
Model model;

if (Storage.TrainingDataFileExists)
{
    trainingData = await Storage.GetTrainingData()
        ?? throw new Exception("Training data is null!");
}
else
{
    trainingData = Tools.GenerateTrainingData();
    await Storage.SaveTrainingData(trainingData);
}

if (Storage.ModelExists())
{
    model = await Storage.GetModel()
        ?? throw new Exception("Model is null!");
}
else
{
    model = new()
    {
        thetas = ThetasInitializations.HeInitialization(layers),
        normParams = new()
        {
            mean = trainingData.Average(),
            standardDeviation = Tools.GetStandardDeviation(trainingData)
        }
    };
    await Storage.SaveModel(model);
}

var network = new Network(new()
{
    layers = layers,
    f = f,
    normParams = model.normParams,
    iterationsCount = ITERATIONS_COUNT
});

MSECalculator.LogMse(new()
{
    f = f,
    iterationsCount = ITERATIONS_COUNT,
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