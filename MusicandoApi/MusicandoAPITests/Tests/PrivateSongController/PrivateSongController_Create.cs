using Newtonsoft.Json;
using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Linq;
using Xunit;
using MusicandoAPITests;
using MusicandoAPI.Models;
using MusicandoAPITests.Helpers;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MusicandoAPITests.Tests.PrivateSongController
{
    public partial class PrivateSongControllerTests : IClassFixture<MySetupFixture>
    {
        /// <summary>
        /// Auxiliary method that sets request content, executes request, verifies response's http status code for
        /// the request to '/api/musicasprivadas/criar' [Action: 'Create' , Controller: 'PrivateSongController']
        /// </summary>
        /// <param name="model">Object to be sent as content in POST request</param>
        /// <param name="expectedHttpCode">expected response's http status code </param>
        /// <returns>Response's content as JSON string</returns>
        public async Task<string> Create_Act(PrivateSongBM model, HttpStatusCode expectedHttpCode)
        {
            //ARRANGE: POST request path and content
            string requestPath = "/api/musicasprivadas/criar";
            string jsonContent = JsonConvert.SerializeObject(model);
            StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            //ACT:
            var response = await fixture._client.PostAsync(requestPath, content);

            //ASSERT: Correct Http Status Code
            Assert.Equal(expectedHttpCode, response.StatusCode);

            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Test Cases: Authenticated user creates private song using a valid model.
        /// Expectation: returns HttpStatusCode.OK; returns correct model; saves song to database correctly;
        /// </summary>
        /// <param name="model">Multiple test cases for different valid models.</param>
        /// 
        [MemberData(nameof(PrivateSong_ListOfValidModels))]
        [Theory]
        public async void Create_ValidModel(PrivateSongBM model)
        {
            //ARRANGE: authenticate user
            MyUser user = fixture.Authenticate_User("Miguel");

            //ACT
            string responseContentString = await Create_Act(model, HttpStatusCode.OK);

            //ASSERT: Correct Response Object
            PrivateSongBasicVM responseObject = JsonConvert.DeserializeObject<PrivateSongBasicVM>(responseContentString);
            Assert.Equal(model.Name, responseObject.Name);
            Assert.True(Guid.TryParse(responseObject.PrivateSongId, out Guid auxPrivateSongId));
            Assert.True(Guid.TryParse(responseObject.SongId, out Guid auxSongId));

            //ASSERT: Correct Database State

            Song expected = new Song();
            expected.SongId = auxSongId;

            expected.PrivateSong = new PrivateSong();
            expected.PrivateSong.PrivateSongId = auxPrivateSongId;
            expected.PrivateSong.Name = model.Name;
            expected.PrivateSong.ArtistName = model.ArtistName;
            expected.PrivateSong.AlbumName = model.AlbumName;
            expected.PrivateSong.MyUser = user;

            expected.Video = new Video();
            expected.Video.VideoUrl = model.VideoUrl;
            expected.Video.StartSec = Video.GetTimeInSeconds(model.StartAt);
            expected.Video.EndSec = Video.GetTimeInSeconds(model.EndAt);
            expected.Video.Duration = Video.GetDuration(expected.Video.StartSec, expected.Video.EndSec);

            Assert.True(MySqlHelpers.CheckIfPrivateSongWasCreated(expected));
        }

        /// <summary>
        /// Test case: A request is sent with a valid model but no user is authenticated.
        /// Expectation: returns HttpStatusCode.Unauthorized, empty response; 
        /// </summary>
        [Fact]
        public async void Create_ValidModel_Unauthorized()
        {
            //ARRANGE: Set a valid model
            PrivateSongBM model = new PrivateSongBM("MyUnauthorized", "MyArtistName", "MyAlbumName", "aP6orw0M-bY", "00:00:05", "00:03:56");

            //ACT
            string responseContentString = await Create_Act(model, HttpStatusCode.Unauthorized);

            //ASSERT: Correct Response Object
            Assert.Equal("", responseContentString);

        }


        /// <summary>
        /// Test Cases: Authenticated user tries to create private song using an invalid model.
        /// Expectation: returns HttpStatusCode.BadRequest; empty response;
        /// </summary>
        /// <param name="model"></param>
        [MemberData(nameof(PrivateSong_ListOfInvalidModels))]
        [Theory]
        public async void Create_InvalidModel(PrivateSongBM model)
        {
            MyUser user = fixture.Authenticate_User("Miguel");

            //ACT
            string responseContentString = await Create_Act(model, HttpStatusCode.BadRequest);

            //ASSERT: Correct Response Object
            Assert.Equal("", responseContentString);

        }

    }
}
