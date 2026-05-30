using Neurons.Network;

namespace App.Web.NetworkM;

public static class Normalization
{
    public static NormalizationParameters GetNormalizationParameters(double[] numbers)
    {
        var mean = numbers.Average();
        var sum = numbers.Sum(d => Math.Pow(d - mean, 2));
        var std = Math.Sqrt(sum / numbers.Length);

        return new()
        {
            mean = mean,
            standardDeviation = std
        };
    }

    public static double Normalize(double x, NormalizationParameters p)
        => (x - p.mean) / p.standardDeviation;

    public static double Denormalize(double x, NormalizationParameters p)
        => x * p.standardDeviation + p.mean;
}
