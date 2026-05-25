using App.Web.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Neurons;

namespace App.Web;

public record Data
{
    public int M { get; set; }
    public int TotalIterations { get; set; }
}

public class MSECalculator
{
    readonly IHubContext<NetworkHub, INetworkClient> _hub;

    readonly List<double> mses = [];
    readonly AppSettings settings;

    /// <summary>
    /// Calculate MSE at this much of intervals of iterations
    /// </summary>
    int calMseAt;
    int lastItrIdx; // Last iteration index
    int m;
    double mse;
    /// <summary>
    /// If MSE should be calculated for the current iteration.
    /// Set when iteration starts
    /// </summary>
    bool calMse = false;

    public MSECalculator(Network network, IHubContext<NetworkHub, INetworkClient> networkHub,
        Function _func, IOptions<AppSettings> options)
    {
        _hub = networkHub;
        settings = options.Value;

        network.IterationStarted += Network_IterationStarted;
        network.ForwardPropagationCompleted += Network_ForwardPropagationCompleted;
        network.IterationCompleted += Network_IterationCompleted;
    }

    public void SetData(Data data)
    {
        m = data.M;
        lastItrIdx = data.TotalIterations - 1;
        calMseAt = (data.TotalIterations < settings.MaxMsesToSend ?
            data.TotalIterations :
            (int)Math.Ceiling((double)data.TotalIterations / settings.MaxMsesToSend));
    }

    private void Network_IterationStarted(object? sender, int i)
    {
        calMse = i % calMseAt == 0 || i == 0 || i == lastItrIdx;
        if (i == 0) mses.Clear();
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
