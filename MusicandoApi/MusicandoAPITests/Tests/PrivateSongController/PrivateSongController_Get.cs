using Newtonsoft.Json;
using System;
using System.Net;
using System.Net.Http;
using System.Text;
using Xunit;
using MusicandoAPITests;
using MusicandoAPI.Models;
using MusicandoAPITests.Helpers;
using System.Threading.Tasks;

namespace MusicandoAPITests.Tests.PrivateSongController
{
    public partial class PrivateSongControllerTests : IClassFixture<MySetupFixture>
    {

        /// <summary>
        /// Auxiliary method that sets request path, executes request, verifies response's http status code for
        /// request to '/api/musicasprivadas' [Action: 'Get' , Controller: 'PrivateSongController']
        /// </summary>
        /// <param name="expectedHttpCode">Expected http status code </param>
        /// <returns>Response's content, as JSON string</returns>
        public async Task<string> Get_Act(HttpStatusCode expectedHttpCode)
        {
            //ARRANGE: GET request path
            string requestPath = $"/api/musicasprivadas";

            //ACT:
            var response = await fixture._client.GetAsync(requestPath);

            //ASSERT: Correct Http Status Code
            Assert.Equal(expectedHttpCode, response.StatusCode);

            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Test case: A request is sent correctly and user is authenticated.
        /// Expectation: returns HttpStatusCode.OK, response contains basic info about 
        ///     private songs in database.
        /// </summary>
        [Fact]
        public async void Get_Authenticated()
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Miguel");

            //ACT:
            string responseContentString = await Get_Act(HttpStatusCode.OK);

            //ASSERT: Response object matches database state
            PrivateSongBasicVM[] responseObject =
                JsonConvert.DeserializeObject<PrivateSongBasicVM[]>(responseContentString);

            Assert.True(MySqlHelpers.CheckIfPrivateSongListMatchesDb(responseObject, user));
        }

        /// <summary>
        /// Test case: A request is sent but no user is authenticated.
        /// Expectation: returns HttpStatusCode.Unauthorized, empty response; 
        /// </summary>
        [Fact]
        public async void Get_Unauthorized()
        {
            //ACT:
            string responseContentString = await Get_Act(HttpStatusCode.Unauthorized);

            //ASSERT: Correct response object
            Assert.Equal("", responseContentString);
        }
    }
}
