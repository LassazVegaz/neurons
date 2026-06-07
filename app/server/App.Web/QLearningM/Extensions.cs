using Neurons.QLearning;

namespace App.Web.QLearningM;

public static class Extensions
{
    public static IServiceCollection AddQLearningServices(this IServiceCollection services)
    {
        services.AddSingleton<QLearning>();
        services.AddSingleton<QLearningEventsListener>();
        services.AddSingleton<ActionPerformer>();

        services.AddOptions<QLearningSettings>()
                .BindConfiguration(QLearningSettings.KEY);

        return services;
    }

    public static WebApplication AddQLearningpps(this WebApplication app)
    {
        app.MapHub<QLearningHub>("/q-learning");

        return app;
    }
}
