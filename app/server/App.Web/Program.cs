using App.Web.DQNM;
using App.Web.NetworkM;
using App.Web.QLearningM;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(
    o => o.AddDefaultPolicy(
        b => b.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowCredentials()));

builder.Services.AddSignalR();

builder.Services.AddNetworkServices();
builder.Services.AddQLearningServices();
builder.Services.AddDQNServices();

var app = builder.Build();

app.UseCors();

app.AddNetworkApps();
app.AddQLearningpps();
app.AddDQNApps();


await app.RunAsync();
