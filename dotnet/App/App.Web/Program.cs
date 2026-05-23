using App.Web;
using App.Web.EventListeners;
using App.Web.Hubs;
using Neurons;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(
    o => o.AddDefaultPolicy(
        b => b.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowCredentials()));

builder.Services.AddSignalR();

builder.Services.AddSingleton<NetworkEventListener>();
builder.Services.AddSingleton<Function>();
builder.Services.AddSingleton<Network>();
builder.Services.AddSingleton<MSECalculator>();
builder.Services.AddSingleton<Storage>();

builder.Services.AddOptions<AppSettings>()
                .BindConfiguration(AppSettings.KEY);


var app = builder.Build();

app.UseCors();

app.MapHub<NetworkHub>("/network");

app.Services.GetRequiredService<NetworkEventListener>();


app.Run();
