using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MusicandoAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MusicandoAPI.Data
{
    public static class DBInitializer
    {
        public static void InitializeDatabase(MyDbContext context, UserManager<MyUser> userManager, string storedProcedure)
        {

            //1) delete db
            context.Database.EnsureDeleted();

            //2) create db:
            context.Database.EnsureCreated();

            //3) add seed users:
            AddUserData(userManager);

            //4) restore seed data:
            context.Database.ExecuteSqlCommand(storedProcedure);

        }

        private static void AddUserData(UserManager<MyUser> userManager)
        {
            //delete all first
            foreach (MyUser u in userManager.Users.ToList())
                userManager.DeleteAsync(u).Wait();

            var users = MusicandoAPI.Data.InitialUserData.AllUsers;

            foreach (var u in users)
            {
                var myuser = new MyUser { UserName = u.Name, Email = u.Email };
                var result = userManager.CreateAsync(myuser, u.Pass).Result;
                var myclaims = new List<Claim>();
                myclaims.Add(new Claim(ClaimTypes.Name, u.Name, ClaimValueTypes.String));
                myclaims.Add(new Claim(ClaimTypes.Role, u.Role, ClaimValueTypes.String));
                var result2 = userManager.AddClaimsAsync(myuser, myclaims).Result;
            }
        }

    }
}
