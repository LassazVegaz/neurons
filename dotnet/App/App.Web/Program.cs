using App.Web.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();


var app = builder.Build();

app.MapHub<NetworkHub>("/network");


app.Run();
