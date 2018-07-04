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
        /// Auxiliary method that sets request content, executes request, verifies response's http status code for
        /// the request to '/api/musicasprivadas/apagar' [Action: 'Delete' , Controller: 'PrivateSongController']
        /// </summary>
        /// <param name="privateSongId">PrivateSongId of the song to be deleted</param>
        /// <param name="expectedHttpCode">expected response's http status code </param>
        /// <returns>Response's content as JSON string</returns>
        public async Task<string> Delete_Act(string privateSongId, HttpStatusCode expectedHttpCode)
        {
            //ARRANGE: POST request path and content
            string requestPath = $"/api/musicasprivadas/apagar/{privateSongId}";

            //ACT:
            var response = await fixture._client.PostAsync(requestPath, null);

            //ASSERT: Correct Http Status Code
            Assert.Equal(expectedHttpCode, response.StatusCode);

            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Test Cases: Authenticated user deletes private song using a valid privateSongId.
        /// Expectation: returns HttpStatusCode.OK; returns correct model; deletes song to database correctly;
        /// </summary>
        [Fact]
        public async void Delete_ValidId()
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Anabela");

            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId(user.UserName);

            //ACT:
            string responseContentString = await Delete_Act(privateSongId, HttpStatusCode.OK);

            //ASSERT: Correct Response Object
            PrivateSongBasicVM responseObject = JsonConvert.DeserializeObject<PrivateSongBasicVM>(responseContentString);
            Assert.Null(responseObject.Name);
            Assert.Equal(privateSongId,responseObject.PrivateSongId);
            Assert.True(Guid.TryParse(responseObject.SongId, out Guid auxSongId));

            //ASSERT: Correct Database State
            Assert.True(MySqlHelpers.CheckIfPrivateSongWasDeleted(privateSongId));
        }


        /// <summary>
        /// Test Cases: Authenticated user tries to delete private song using an invalid privateSongId.
        /// (always use "Anabela" for InvalidIds, because an Id from Miguel's private songs is used 
        /// as an InvalidId - users should not be able to change other user's private songs) 
        /// Expectation: returns HttpStatusCode.NotFound; empty response;
        /// </summary>
        /// <param name="model"></param>
        [Theory]
        [MemberData(nameof(PrivateSong_InvalidIds))]
        public async void Delete_InvalidId(string privateSongId)
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Anabela");

            //ACT:
            string responseContentString = await Delete_Act(privateSongId, HttpStatusCode.NotFound);

            //ASSERT: Correct Response Object
            Assert.Equal("", responseContentString);
        }


        /// <summary>
        /// Test case: A request is sent with a valid id but no user is authenticated.
        /// Expectation: returns HttpStatusCode.Unauthorized, empty response; 
        /// </summary>
        [Fact]
        public async void Delete_ValidId_Unauthorized()
        {
            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId("Anabela");

            //ACT:
            string responseContentString = await Delete_Act(privateSongId, HttpStatusCode.Unauthorized);

            //ASSERT: Correct Response Object
            Assert.Equal("", responseContentString);
        }

    }
}
