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
        /// request to '/api/musicasprivadas/info' [Action: 'GetInfo' , Controller: 'PrivateSongController']
        /// </summary>
        /// <param name="privateSongId">PrivateSongId of the private song about which we want more info</param>
        /// <param name="expectedHttpCode">expected response's http status code </param>
        /// <returns>Response's content as JSON string</returns>
        public async Task<string> GetInfo_Act(string privateSongId, HttpStatusCode expectedHttpCode)
        {
            //ARRANGE: POST request path and content
            string requestPath = $"/api/musicasprivadas/info/{privateSongId}";

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
        public async void GetInfo_Authenticated()
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Miguel");

            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId(user.UserName);

            //ACT:
            string responseContentString = await GetInfo_Act(privateSongId, HttpStatusCode.OK);

            //ASSERT: Response object matches database state
            PrivateSongBM responseObject =
                JsonConvert.DeserializeObject<PrivateSongBM>(responseContentString);

            Assert.True(MySqlHelpers.CheckIfPrivateSongBmMatchesDb(privateSongId, responseObject));
        }

        /// <summary>
        /// Test case: A request is sent with valid info but user is not authenticated
        /// Expectation: returns HttpStatusCode.Unauthorized, empty response; 
        /// </summary>
        [Fact]
        public async void GetInfo_Unauthorized()
        {
            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId("Miguel");

            //ACT:
            string responseContentString = await GetInfo_Act(privateSongId, HttpStatusCode.Unauthorized);

            //ASSERT: Correct response object
            Assert.Equal("", responseContentString);
        }

        /// <summary>
        /// Test case: A request is sent with an invalid privateSongId.
        /// (always use "Anabela" for InvalidIds, as an Id from "Miguel" private songs is used 
        /// as an InvalidId - users should not be able to access other user's private songs) 
        /// Expectation: returns HttpStatusCode.NotFound, empty response; 
        /// </summary>
        [Theory]
        [MemberData(nameof(PrivateSong_InvalidIds))]
        public async void GetInfo_InvalidId(string privateSongId)
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Anabela");

            //ACT:
            string responseContentString = await GetInfo_Act(privateSongId, HttpStatusCode.NotFound);

            //ASSERT: Correct response object
            Assert.Equal("", responseContentString);
        }
    }
}
