namespace Neurons.App.Console;

internal static class Tools
{
    private const int TRAINING_DATA_COUNT = 1000;

    public static double GetStandardDeviation(double[] numbers)
    {
        var avg = numbers.Average();
        var sum = numbers.Sum(d => Math.Pow(d - avg, 2));
        return Math.Sqrt(sum / numbers.Length);
    }

    public static double[] GenerateTrainingData()
    {
        var data = new double[TRAINING_DATA_COUNT];

        for (var i = 0; i < TRAINING_DATA_COUNT; i++)
            data[i] = Random.Shared.NextDouble() * TRAINING_DATA_COUNT;

        return data;
    }
}