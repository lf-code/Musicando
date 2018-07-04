#define INITIALIZEDB

using System;
using System.IO;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MusicandoAPI.Data;
using MusicandoAPI.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;

namespace MusicandoAPI
{
    public class Program
    {
    
        public static void Main(string[] args)
        {
            var host = BuildWebHost(args).Build();

            //Use appSettings to set whether the database should be restored:
            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var config = services.GetService<IConfiguration>();
                var env = services.GetService<IHostingEnvironment>();

                // Set config variables in appSettings.{ENV}.json 
                bool ShouldInitializeDb = bool.Parse(config["ShouldInitializeDb"]);

                if (ShouldInitializeDb)
                {
                    var context = services.GetService<MyDbContext>();
                    var userManager = services.GetService<UserManager<MyUser>>();
                    string storedProcedure = config["MyRestoreDbStoredProcedure"];

                    DBInitializer.InitializeDatabase(context, userManager, storedProcedure);
                }
            }

            host.Run();
        }

        //https://blog.dudak.me/2017/what-does-webhost-createdefaultbuilder-do/
        //https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-2.0&tabs=basicconfiguration
        //https://docs.microsoft.com/en-us/aspnet/core/fundamentals/startup?view=aspnetcore-2.0

        //Also used by MusicandoApiTests project, to build test server
        public static IWebHostBuilder BuildWebHost(string[] args, bool useTestingEnv = false, string contentRootPath = null)
        {
            var builder = WebHost.CreateDefaultBuilder(args);

            if (useTestingEnv)
            {
                builder = builder.UseContentRoot(contentRootPath);
                builder = builder.UseEnvironment("Testing");
            }

            builder = builder.ConfigureLogging((hostingContext, logging) =>
            { 
                //Configure loggers:
                StreamWriter sw = new StreamWriter(hostingContext.HostingEnvironment.ContentRootPath + $"/logs/Musicando.log", true);
                sw.AutoFlush = true;
                Console.SetOut(sw);

                logging.ClearProviders();
                logging.AddConsole();
                logging.AddFilter<ConsoleLoggerProvider>("Microsoft", LogLevel.Warning);
                logging.AddFilter<ConsoleLoggerProvider>("MusicandoApi", LogLevel.Information);
            });

            return builder.UseStartup<Startup>();

        }
    }
}
