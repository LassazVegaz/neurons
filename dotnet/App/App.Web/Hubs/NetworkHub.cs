using Microsoft.AspNetCore.SignalR;

namespace App.Web.Hubs;

public class NetworkHub : Hub
{
    public async Task Train()
    {
        Console.WriteLine("Train function");
    }
}
