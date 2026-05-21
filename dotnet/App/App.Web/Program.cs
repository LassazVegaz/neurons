using App.Web.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(
    o => o.AddDefaultPolicy(
        b => b.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowCredentials()));

builder.Services.AddSignalR();


var app = builder.Build();

app.UseCors();

app.MapHub<NetworkHub>("/network");


app.Run();
