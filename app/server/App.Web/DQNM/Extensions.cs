using Neurons.DQN;

namespace App.Web.DQNM;

public static class Extensions
{
    public static IServiceCollection AddDQNServices(this IServiceCollection services)
    {
        services.AddSingleton<EventsListener>();
        services.AddSingleton<Storage>();
        services.AddSingleton<DQN>();
        services.AddSingleton<ActionPerformer>();

        services.AddOptions<DQNSettings>()
                .BindConfiguration(DQNSettings.KEY);

        return services;
    }

    public static WebApplication AddDQNApps(this WebApplication app)
    {
        app.MapHub<DQNHub>("/dqn");

        return app;
    }
}
