using Neurons.Network;

namespace Neurons.DQN;

public class TrainParameters
{
    public required Thetas t;
    public required int iterations;
    public required int maxPeriods;
    public required double[] initialState;
    public required int noOfActions;
    public required double lambda;
    public required double alpha;
    public required Func<double, ActionResults> act;
}

public class ActionResults
{
    public required double reward;
    public required bool gameOver;
    public double[] nextState = [];
}

public class DQN(int[] layers)
{
    readonly int[] layers = layers;

    int noOfActions;
    double alpha;
    Thetas learningT = new() { b = [], w = [] };


    public void Train(TrainParameters p)
    {
        noOfActions = p.noOfActions;
        alpha = p.alpha;
        learningT = p.t.Clone();

        var learningP = new Predictor(learningT, layers);
        var targetP = new Predictor(p.t, layers);

        var greediness = 0;
        var greedinessRate = 1 / (p.iterations - 1);

        for (var i = 0; i < p.iterations; i++)
        {
            var s = p.initialState;

            greediness += greedinessRate;

            for (var j = 0; j < p.maxPeriods; j++)
            {
                // predict Q values for the state
                var predicted = learningP.Forward(s);
                // do the next action
                var a = NextAction(predicted, greediness);
                var actRes = p.act(a);

                // start calculating target Q value
                var targetQ = actRes.reward;
                // accumulate possible future reward
                if (!actRes.gameOver)
                    targetQ += p.lambda * MaxQ(targetP, actRes.nextState);

                // back propagation
                Backward(predicted, targetQ, a);

                if (actRes.gameOver) break;
                s = actRes.nextState;
            }

            if (i % 50 == 0)
                targetP.t = learningT.Clone();
        }
    }


    private static int GetBestAction(ForwardResults forwardResults)
    {
        var qValues = forwardResults.befA[^1];
        var maxIdx = 0;

        for (var i = 1; i < qValues.Length; i++)
            if (qValues[i] > qValues[maxIdx]) maxIdx = i;

        return maxIdx;
    }

    private void Backward(ForwardResults predicted, double targetQ, int a)
    {
        // construct y (targets) for backprop
        var y = (double[])predicted.befA[^1].Clone();
        y[a] = targetQ;

        // back propagation and updating thetas
        var dT = Backward(learningT, predicted, y);
        UpdateThetas(learningT, dT, alpha);
    }

    private Thetas Backward(Thetas t, ForwardResults fResult, double[] y)
    {
        var dT = ThetasInitializations.ZeroInitialization(layers);
        var predicted = fResult.befA[^1];

        // error signals comming from every neurone
        var eSignal = new double[layers.Length][];
        eSignal[^1] = new double[y.Length];
        for (var b = 0; b < y.Length; b++)
            eSignal[^1][b] = -(y[b] - predicted[b]);

        // from the last layer to the first one
        for (var b = layers.Length - 1; b > 0; b--)
        {
            var prevLayerI = b - 1; // prev layer index
            var gapI = b - 1; // gap index for thetas

            // for every neurone in the current layer
            for (var c = 0; c < layers[b]; c++)
            {
                // accumulating partial derivative of bias
                dT.b[gapI][c] += eSignal[b][c];

                // for every neurone in the previous layer
                for (var d = 0; d < layers[prevLayerI]; d++)
                {
                    // accumulating partial derivative of weights
                    dT.w[gapI][c][d] += fResult.a[prevLayerI][d] * eSignal[b][c];
                }
            }

            // calculating error signals
            eSignal[prevLayerI] = new double[layers[prevLayerI]];

            // for every neurone in the previous layer
            for (var c = 0; c < layers[prevLayerI]; c++)
            {
                // for every neurone in the current layer
                for (var d = 0; d < layers[b]; d++)
                {
                    eSignal[prevLayerI][c] +=
                       Derivatives.DRelU(fResult.befA[prevLayerI][c]) *
                       t.w[gapI][d][c] * eSignal[b][d];
                }
            }
        }

        return dT;
    }

    private void UpdateThetas(Thetas t, Thetas dT, double alpha)
    {
        for (var b = 0; b < layers.Length - 1; b++)
        {
            for (var c = 0; c < layers[b + 1]; c++)
            {
                t.b[b][c] -= alpha * dT.b[b][c];

                for (var d = 0; d < layers[b]; d++)
                    t.w[b][c][d] -= alpha * dT.w[b][c][d];
            }
        }
    }

    private static double MaxQ(Predictor p, double[] s)
    {
        var res = p.Forward(s);
        return res.befA[^1].Max();
    }

    private int NextAction(ForwardResults res, double greediness)
    {
        return greediness < Random.Shared.NextDouble() ?
            GetBestAction(res) : Random.Shared.Next(noOfActions);
    }
}
