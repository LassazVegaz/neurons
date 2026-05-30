namespace Neurons.Network;

/// <summary>
/// Weights and biases of the network.
/// Weights and biases exist in the gaps between two layer.
/// Ex: If there are 3 layers, there are 2 gaps.
/// </summary>
public record Thetas
{
    /// <summary>
    /// Weights. <br />
    /// 1st dimension - gap index <br />
    /// 2nd dimension - index of the neurone ahead <br />
    /// 3rd dimension - index of the neurone behind
    /// </summary>
    public required double[][][] w;

    /// <summary>
    /// Biases
    /// 1st dimension - gap index <br />
    /// 2nd dimension - index of the neurone ahead
    /// </summary>
    public required double[][] b;
}


public record ForwardResults
{
    /// <summary>
    /// Activations of every neurone
    /// </summary>
    public required double[][] a;

    /// <summary>
    /// Before activations.
    /// Inputs to every neurones
    /// </summary>
    public required double[][] befA;
}

public record BackwardResults
{

}

public record NormalizationParameters
{
    public required double standardDeviation;
    public required double mean;
}

public record NetworkParameters
{
    public required int[] layers;
    public required Func<double, double> f;
    public required int iterationsCount;
    public required double alpha;
    public required double[] inputs;
    public required double[] targets;
    public required Thetas t;
}