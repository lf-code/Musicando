using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using MusicandoAPI;
using MusicandoAPI.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Net;
using System.Net.Http;
using System.Text;
using Xunit;

namespace MusicandoAPITests.Helpers
{
    public class MySetupFixture
    {
        /*Collection Fixtures: When to use: when you want to create a single test context and share it among tests in several test classes, 
        * and have it cleaned up after all the tests in the test classes have finished.
        */

        //https://docs.microsoft.com/en-us/aspnet/core/testing/integration-testing?view=aspnetcore-2.0

        //A test server that serves up the app we are testing with test requests from client. 
        public readonly TestServer _server;

        //the http client that will make test requests to our app. 
        public readonly HttpClient _client;

        //random number generator to be used in some tests
        public Random r = new Random();

        //Credentials of test users: Dictionary<userName, password>
        Dictionary<string, string> testUsersCredentials = Secrets.TestSecrets.TestUsersCredentials;


        //ContentRootPath
        string contentRootPath = Secrets.TestSecrets.ContentRootPath;

        //This constructor code runs once BEFORE all tests 
        //in a class that implements IClassFixture<MySetupFixture>
        public MySetupFixture()
        {

            _server = new TestServer(MusicandoAPI.Program.BuildWebHost(null,true, contentRootPath));

            _client = _server.CreateClient();

            RestoreDatabase();

        }

        public MyUser Authenticate_User(string userName)
        {
            if (!testUsersCredentials.ContainsKey(userName))
                throw new ArgumentOutOfRangeException("No credentials for such username!");

            LoginBM m = new LoginBM();
            m.Username = userName;
            m.Password = testUsersCredentials[userName];
            var stringContent = new StringContent(JsonConvert.SerializeObject(m), System.Text.Encoding.UTF8, "application/json");
            var lgresponse = _client.PostAsync("/api/user/login", stringContent).Result;

            Assert.Equal(HttpStatusCode.OK, lgresponse.StatusCode);
            lgresponse.Headers.TryGetValues("set-cookie", out IEnumerable<string> s);
            List<string> s1 = new List<string>(s);

            _client.DefaultRequestHeaders.TryAddWithoutValidation("Cookie", s1[0]);

            return new MyUser() { UserName = userName };
        }

        public static void RestoreDatabase()
        {
            string connectionString = "Server = (localdb)\\MSSQLLocalDB; Database = MusicandoSeedData; Trusted_Connection = True; ";
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand("[MusicandoSeedData].dbo.RestoreDatabase_MusicandoTesting", connection);
                command.CommandType = System.Data.CommandType.StoredProcedure;
                connection.Open();
                command.ExecuteNonQuery();
            }
        }


        //runs once AFTER all tests 
        //in a class that implements IClassFixture<MySetupFixture>
        public void Dispose()
        {
            //RestoreDatabase();
        }
    }



}
