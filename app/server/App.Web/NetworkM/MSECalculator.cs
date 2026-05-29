using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons.Network;

namespace App.Web.NetworkM;

public record Data
{
    public int M { get; set; }
    public int TotalIterations { get; set; }
}

public class MSECalculator
{
    readonly IHubContext<NetworkHub, INetworkClient> _hub;

    readonly List<double> mses = [];
    readonly NetworkSettings settings;


    int lastItrIdx; // Last iteration index
    int m;
    double mse;
    /// <summary>
    /// If MSE should be calculated for the current iteration.
    /// Set when iteration starts
    /// </summary>
    bool calMse = false;
    double step;
    double accumulator;

    public MSECalculator(Network network, IHubContext<NetworkHub, INetworkClient> networkHub,
        IOptions<NetworkSettings> options)
    {
        _hub = networkHub;
        settings = options.Value;

        network.IterationStarted += Network_IterationStarted;
        network.ForwardPropagationCompleted += Network_ForwardPropagationCompleted;
        network.IterationCompleted += Network_IterationCompleted;
    }

    public void SetData(Data data)
    {
        mses.Clear();
        m = data.M;
        lastItrIdx = data.TotalIterations - 1;

        var allowedMsesCount = Math.Min(data.TotalIterations, settings.MaxMsesToSend);
        step = (double)allowedMsesCount / data.TotalIterations;
        accumulator = 0;
    }

    private void Network_IterationStarted(object? sender, int i)
    {
        accumulator += step;

        if (accumulator >= 1 || i == 0 || i == lastItrIdx)
        {
            calMse = true;
            accumulator -= 1;
        }
        else
            calMse = false;
    }

    private void Network_ForwardPropagationCompleted(object? sender, ForwardEventArgs e)
    {
        if (!calMse) return;

        var fRes = e.fResults;
        var predicted = fRes.befA[^1][0];
        mse += Math.Pow(e.y - predicted, 2);
    }

    private async void Network_IterationCompleted(object? sender, int i)
    {
        if (calMse)
        {
            mse /= 2 * m;
            mses.Add(mse);
            mse = 0;
        }

        if (i % settings.MsesSendingInterval == 0 || i == 0 || i == lastItrIdx)
            await _hub.Clients.All.IterationBreak(i, [.. mses]);
    }
}
