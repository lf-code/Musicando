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

        public PrivateSongBM ValidModelForEdit = new PrivateSongBM("MySongEdited", "MyArtistEdited", "MyAlbumEdited",
                "aP6orw0M-bY", "00:00:15", "00:02:56");

        /// <summary>
        /// Auxiliary method that sets request content, executes request, verifies response's http status code for
        /// request to '/api/musicasprivadas/editar' [Action: 'Edit' , Controller: 'PrivateSongController']
        /// </summary>
        /// <param name="privateSongId">PrivateSongId of the song to be edited</param>
        /// <param name="model">model with new info to be sent as content in POST request</param>
        /// <param name="expectedHttpCode">expected response's http status code </param>
        /// <returns>Response's content as JSON string</returns>
        public async Task<string> Edit_Act(string privateSongId, PrivateSongBM model, HttpStatusCode expectedHttpCode)
        {
            //ARRANGE: POST request path and content
            string requestPath = $"/api/musicasprivadas/editar/{privateSongId}";
            string jsonContent = JsonConvert.SerializeObject(model);
            StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            //ACT:
            var response = await fixture._client.PostAsync(requestPath, content);

            //ASSERT: Correct Http Status Code
            Assert.Equal(expectedHttpCode, response.StatusCode);

            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Test case: A request is sent with a valid privateSongId and valid model, 
        /// and the user is authenticated.
        /// Expectation: returns HttpStatusCode.Ok, correct response object, correct database state; 
        /// </summary>
        [Fact]
        public async void Edit_Valid()
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Anabela");

            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId(user.UserName);

            //ARRANGE: Set a privateSong model with the new info for the song
            PrivateSongBM model = ValidModelForEdit;

            //ACT:
            string responseContentString = await Edit_Act(privateSongId,model, HttpStatusCode.OK);

            //ASSERT: Correct response object
            PrivateSongBasicVM responseObject = JsonConvert.DeserializeObject<PrivateSongBasicVM>(responseContentString);
            Assert.Equal(model.Name, responseObject.Name);
            Assert.Equal(privateSongId, responseObject.PrivateSongId);
            Assert.True(Guid.TryParse(responseObject.SongId, out Guid auxSongId));


            //ASSERT: Correct database state

            Song expected = new Song();
            expected.SongId = auxSongId;

            expected.PrivateSong = new PrivateSong();
            expected.PrivateSong.PrivateSongId = Guid.Parse(privateSongId);
            expected.PrivateSong.Name = model.Name;
            expected.PrivateSong.ArtistName = model.ArtistName;
            expected.PrivateSong.AlbumName = model.AlbumName;
            expected.PrivateSong.MyUser = user;

            expected.Video = new Video();
            expected.Video.VideoUrl = model.VideoUrl;
            expected.Video.StartSec = Video.GetTimeInSeconds(model.StartAt);
            expected.Video.EndSec = Video.GetTimeInSeconds(model.EndAt);
            expected.Video.Duration = Video.GetDuration(expected.Video.StartSec,expected.Video.EndSec);

            Assert.True(MySqlHelpers.CheckIfPrivateSongWasCreated(expected, true));
        }

        /// <summary>
        /// Test case: A request is sent with valid info but user is not authenticated
        /// Expectation: returns HttpStatusCode.Unauthorized, empty response; 
        /// </summary>
        [Fact]
        public async void Edit_Valid_Unauthorized()
        {
            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId("Anabela");

            //ARRANGE: Set a privateSong model with the new info for the song
            PrivateSongBM model = ValidModelForEdit;

            //ACT:
            string responseContentString = await Edit_Act(privateSongId, model, HttpStatusCode.Unauthorized);

            //ASSERT: Correct response object
            Assert.Equal("", responseContentString);
        }

        /// <summary>
        /// Test case: A request is sent with an invalid privateSongId.
        /// (always use "Anabela" for InvalidIds, as an Id from "Miguel" private songs is used 
        /// as an InvalidId - users should not be able to change other user's private songs) 
        /// Expectation: returns HttpStatusCode.NotFound, empty response; 
        /// </summary>
        [MemberData(nameof(PrivateSong_InvalidIds))]
        [Theory]
        public async void Edit_InvalidGuid_NotFound(string privateSongId)
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Anabela");

            //ARRANGE: Set a privateSong model with the new info for the song
            PrivateSongBM model = ValidModelForEdit;

            //ACT:
            string responseContentString = await Edit_Act(privateSongId, model, HttpStatusCode.NotFound);

            //ASSERT: Correct response object
            Assert.Equal("", responseContentString);
        }

        /// <summary>
        /// Test case: A request is sent with an invalid model.
        /// Expectation: returns HttpStatusCode.BadRequest, empty response; 
        /// </summary>
        [Theory]
        [MemberData(nameof(PrivateSong_ListOfInvalidModels))]
        public async void Edit_InvalidModel(PrivateSongBM model)
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Anabela");

            //ARRANGE: Get a valid and existing privateSongId
            string privateSongId = MySqlHelpers.GetRandomUserPrivateSongId(user.UserName);

            //ACT:
            string responseContentString = await Edit_Act(privateSongId, model, HttpStatusCode.BadRequest);

            //ASSERT: Correct response object
            Assert.Equal("", responseContentString);

        }

    }
}
