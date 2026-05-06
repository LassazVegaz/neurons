namespace Neurons.App.Console;

internal static class EssentialsBuilder
{
    public static async Task<Model> GetModel(GetModelParameters p)
    {
        Model model;

        if (!p.clearModel && Storage.ModelExists())
        {
            model = await Storage.GetModel()
                ?? throw new Exception("Model is null!");
        }
        else
        {
            model = new()
            {
                thetas = ThetasInitializations.HeInitialization(p.layers),
                normParams = new()
                {
                    mean = p.trainingData.Average(),
                    standardDeviation = Tools.GetStandardDeviation(p.trainingData)
                }
            };
            await Storage.SaveModel(model);
        }

        return model;
    }

    public static async Task<double[]> GetTrainingData()
    {
        double[] trainingData;

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

        return trainingData;
    }
}

internal record GetModelParameters
{
    public required int[] layers;
    public required double[] trainingData;
    public required bool clearModel;
}