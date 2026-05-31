using Neurons.Network;

namespace App.Web.DQNM;

public class HubTrainingParameters
{
    public double Alpha { get; set; }
    public double Lambda { get; set; }
    public required int[] Layers { get; set; }
    public bool CreateNewThetas { get; set; }
    public int Iterations { get; set; }
}

public class GameResults
{
    public int Iteration { get; set; }
    public required int[] Actions { get; set; }
    public double TotalRewards { get; set; }
}

public class Model
{
    public required double alpha;
    public required double lambda;
    public required int[] layers;
    public required int iterations;
    public required Thetas thetas;
}