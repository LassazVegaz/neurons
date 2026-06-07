using Neurons.Network;

namespace App.Web.NetworkM;

public static class Extensions
{
    public static IServiceCollection AddNetworkServices(this IServiceCollection services)
    {
        services.AddSingleton<NetworkEventListener>();
        services.AddSingleton<Function>();
        services.AddSingleton<Network>();
        services.AddSingleton<MSECalculator>();
        services.AddSingleton<Storage>();
        services.AddSingleton<TrainingDataCook>();

        services.AddOptions<NetworkSettings>()
                .BindConfiguration(NetworkSettings.KEY);

        return services;
    }

    public static WebApplication AddNetworkApps(this WebApplication app)
    {
        app.MapHub<NetworkHub>("/network");

        return app;
    }
}
