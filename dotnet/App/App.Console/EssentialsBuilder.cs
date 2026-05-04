namespace Neurons.App.Console;

internal static class EssentialsBuilder
{
    public static async Task<Model> GetModel(int[] layers, double[] trainingData)
    {
        Model model;

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
