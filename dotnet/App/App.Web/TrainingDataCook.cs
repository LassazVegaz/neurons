using App.Shared;
using Microsoft.Extensions.Options;

namespace App.Web;

public class TrainingDataCook(IOptions<AppSettings> options, Function func)
{
    readonly Func<double, double> f = func.f;
    readonly AppSettings settings = options.Value;

    public TrainingData MakeTrainingData()
    {
        var x = new double[settings.TrainingDataCount]
            .Select((_) =>
            {
                var sign = Random.Shared.NextDouble() > 0.5 ? -1 : 1;
                return Random.Shared.NextDouble() * settings.TrainingDataCount * sign;
            })
            .Order()
            .ToArray();
        var xNormParams = Normalization.GetNormalizationParameters(x);
        var xNorm = x.Select(x => Normalization.Normalize(x, xNormParams))
                     .ToArray();

        var y = x.Select(x => f(x))
                 .ToArray();
        var yNormParams = Normalization.GetNormalizationParameters(y);
        var yNorm = y.Select(y => Normalization.Normalize(y, yNormParams))
                     .ToArray();

        return new()
        {
            x = x,
            xNormParams = xNormParams,
            xNorm = xNorm,

            y = y,
            yNormParams = yNormParams,
            yNorm = yNorm
        };
    }
}
