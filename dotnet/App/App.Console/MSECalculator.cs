using CMD = System.Console;

namespace Neurons.App.Console;

internal class MSECalculator
{
    const int MSE_CAL_COUNT = 10;

    readonly Func<double, double> f;
    readonly int m;
    readonly int calMseAt;
    readonly int lastIterationIdx;

    double sumOfSquareErrors = 0;
    bool calMse = false;

    MSECalculator(MSECalculatorParams p)
    {
        p.network.IterationStarted += IterationStarted;
        p.network.ForwardPropagationCompleted += ForwardPropagationCompleted;
        p.network.IterationCompleted += IterationCompleted;

        f = p.f;
        m = p.m;
        calMseAt = p.iterationsCount / MSE_CAL_COUNT;
        lastIterationIdx = p.iterationsCount - 1;
    }

    private void IterationStarted(object? sender, int i)
    {
        calMse = i == 0 || i == lastIterationIdx || i % calMseAt == 0;
    }

    void ForwardPropagationCompleted(object? sender, ForwardResults fResults)
    {
        if (!calMse) return;

        var x = fResults.befA[0][0];
        var y = f(x);
        var p = fResults.a[^1][0];
        sumOfSquareErrors += Math.Pow(y - p, 2);
    }

    void IterationCompleted(object? sender, int i)
    {
        if (!calMse) return;

        var mse = sumOfSquareErrors / 2 * m;
        CMD.WriteLine($"MSE at {i} = {mse:F6}");
    }

    #region STATIC
    public static void LogMse(MSECalculatorParams p) => _ = new MSECalculator(p);
    #endregion
}

internal record MSECalculatorParams
{
    public required Func<double, double> f;
    public required int m;
    public required int iterationsCount;
    public required Network network;
}