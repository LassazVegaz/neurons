using App.Web.Components;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();


var app = builder.Build();

app.MapStaticAssets();

app.UseAntiforgery();

app.MapRazorComponents<MainApp>()
   .AddInteractiveServerRenderMode();


app.Run();
