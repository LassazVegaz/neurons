using Neurons;
using Neurons.App.Console;

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
    normParams = model.normParams
});