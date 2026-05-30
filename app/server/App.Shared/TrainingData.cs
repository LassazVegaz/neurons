using Neurons.Network;

namespace App.Shared;

public class TrainingData
{
    public required double[] x;
    public required double[] xNorm;
    public required NormalizationParameters xNormParams;

    public required double[] y;
    public required double[] yNorm;
    public required NormalizationParameters yNormParams;
}
