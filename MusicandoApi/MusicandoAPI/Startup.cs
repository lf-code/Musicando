using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.AspNetCore.Identity;
using MusicandoAPI.Models;
using System.Net;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.FileProviders;
using MusicandoAPI.Services;
using MusicandoAPI.Data;

namespace MusicandoAPI
{
    public class Startup
    {
        public Startup(IHostingEnvironment env, IConfiguration config)
        {
            HostingEnvironment = env;
            Configuration = config;
        }

        public IHostingEnvironment HostingEnvironment { get; }
        public IConfiguration Configuration { get; set; }

        public void ConfigureServices(IServiceCollection services)
        {
            //My app services:
            services.AddScoped<MyHelperService, MyHelperService>();

            //DbContext service:
            services.AddDbContext<MyDbContext>(
                options => options.UseSqlServer(Configuration.GetConnectionString("MyDefaultConnection")));

            //Identity service:
            services.AddIdentity<MyUser, MyRole>()
               .AddEntityFrameworkStores<MyDbContext>()
               .AddDefaultTokenProviders();


            //Configure Identity:

            services.Configure<IdentityOptions>(options =>
            {
                // Password settings
                options.Password.RequireDigit = false;
                options.Password.RequiredLength = 4;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;

                // Lockout settings
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
                options.Lockout.MaxFailedAccessAttempts = 10;

            });

            //Do not redirect 403 Forbidden and 401 Unauthorized responses:
            Func<RedirectContext<CookieAuthenticationOptions>, Task> MyNoRedirect = 
                async rc => {
                    rc.HttpContext.Response.StatusCode = 401;
                };

            services.ConfigureApplicationCookie(options =>
            {
                // Cookie settings
                options.Cookie.HttpOnly = true;
                options.Cookie.Expiration = TimeSpan.FromDays(10);
                options.LoginPath = "/api/user/login"; // If the LoginPath is not set here, ASP.NET Core will default to /Account/Login
                options.LogoutPath = "/api/user/logout"; // If the LogoutPath is not set here, ASP.NET Core will default to /Account/Logout
                options.AccessDeniedPath = "/api/user/accessdenied"; // If the AccessDeniedPath is not set here, ASP.NET Core will default to /Account/AccessDenied

                options.SlidingExpiration = true;

                options.Events = new CookieAuthenticationEvents
                {
                    //Avoid redirect for 403 Forbidden responses:
                    OnRedirectToAccessDenied = MyNoRedirect, 
                    //Avoid redirect for 401 Unauthorized responses:
                    OnRedirectToLogin = MyNoRedirect
                };

            });


            //allows Angular's server (4200) to use access this api during angular's development:
            if (HostingEnvironment.IsDevelopment())
            {
                services.AddCors(
                    options => { options.AddPolicy("AllowSpecificOrigin", builder => builder.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod().AllowCredentials()); }
                );
            }


            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app)
        {

            //Authentication
            app.UseAuthentication();

            //Returns homepage with Angular's app: index.html in wwwroot.
            //(UseDefaultFiles must be called before UseStaticFiles to serve the default file)
            app.UseDefaultFiles();

            //Serves static files, such as HTML, CSS, images, and Javascript 
            //directly from  project's web root directory (<content_root>/wwwroot by default):
            app.UseStaticFiles();

            //Creates artificial delay in Development
            if (HostingEnvironment.IsDevelopment())
            {
                app.Use(async (context, next) =>
                {
                    Random r = new Random();
                    System.Threading.Tasks.Task.Delay(r.Next(500, 2000)).Wait();
                    await next.Invoke();
                });
            }

            //Using attribute routing with Http[Verb] attributes
            app.UseMvc();

        }

    }
}
