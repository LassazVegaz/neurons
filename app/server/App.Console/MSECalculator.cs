using CMD = System.Console;

namespace Neurons.App.Console;

internal class MSECalculator
{
    const int MSE_CAL_COUNT = 10;

    readonly Func<double, double> f;
    readonly int m;
    readonly int calMseAt;
    readonly int lastIterationIdx;

    double prevMse;
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
        var p = fResults.befA[^1][0];
        sumOfSquareErrors += Math.Pow(y - p, 2);
    }

    void IterationCompleted(object? sender, int i)
    {
        if (!calMse) return;

        var mse = sumOfSquareErrors / (2 * m);
        if (i == 0) prevMse = mse;

        var mseDrop = -1 * (prevMse - mse);
        var mseDropPerc = mseDrop / prevMse * 100;
        var sign = GetSign(mseDrop);

        CMD.WriteLine($"MSE at {i} = {mse}, Gap = {sign}{mseDrop} ({sign}{mseDropPerc:F2})%");

        prevMse = mse;
        sumOfSquareErrors = 0;
        calMse = false;
    }

    #region STATIC
    public static void LogMse(MSECalculatorParams p) => _ = new MSECalculator(p);

    private static string GetSign(double n) => n > 0 ? "+" : "";
    #endregion
}

internal record MSECalculatorParams
{
    public required Func<double, double> f;
    public required int m;
    public required int iterationsCount;
    public required Network network;
}