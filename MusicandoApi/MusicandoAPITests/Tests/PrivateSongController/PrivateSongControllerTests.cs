using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MusicandoAPI.Models;
using MusicandoAPITests.Helpers;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace MusicandoAPITests.Tests.PrivateSongController
{
    public partial class PrivateSongControllerTests : IClassFixture<MySetupFixture>
    {
        public MySetupFixture fixture;

        public PrivateSongControllerTests(MySetupFixture fixture)
        {
            //xUnit.net creates a new instance of the test class for every test that is run, 
            //so any code which is placed into the constructor of the test class will be run for every single test. 

            this.fixture = fixture;
            this.fixture._client.DefaultRequestHeaders.Clear(); //Clear authentication cookie
        }


        public static IEnumerable<object[]> PrivateSong_InvalidIds()
        { 
            yield return new object[] { null }; //non-existing
            yield return new object[] { "" }; //empty
            yield return new object[] { "asdfasf dsf " }; //invalid
            yield return new object[] { "b4fbfc8e-6bdf-41dc-ac6f-4c32ed9ae9ea" }; //non-existing

            //always use "Anabela" to test invalid ids
            string g = "A5B9B36F-F3E9-47FF-9870-AE12DFADBE5C";
            yield return new object[] { g }; //wrong user
        }

        /// <summary>
        /// List of Valid Models of PrivateSongBM for the creation of new private songs. 
        /// These models should not raise any error in controller.
        /// </summary>
        public static IEnumerable<object[]> PrivateSong_ListOfValidModels()
        {
            PrivateSongBM model;

            //Valid Model: basic
            model = new PrivateSongBM("MySongName", "MyArtistName", "MyAlbumName", "aP6orw0M-bY", "00:00:05", "00:03:56");
            yield return new object[] { model };

            //Valid Model: album name is null
            model = new PrivateSongBM("MySongName", "MyArtistName", null, "aP6orw0M-bY", "00:00:05", "00:03:56");
            yield return new object[] { model };

            //Valid Model: video duration longer than 1 hour
            model = new PrivateSongBM("MySongName", "MyArtistName", "MyAlbumName", "aP6orw0M-bY", "00:00:02", "01:03:56");
            yield return new object[] { model };

        }

        /// <summary>
        /// List of Invalid Models of PrivateSongBM for the creation of new private songs. 
        /// These models should should not result in the creation of a private song.
        /// Instead, they should result in a a BadRequest response.
        /// </summary>
        public static IEnumerable<object[]> PrivateSong_ListOfInvalidModels()
        {
            PrivateSongBM model = new PrivateSongBM();
            model.Name = "MyPrivateSong";
            model.ArtistName = "TestArtist";
            model.AlbumName = "album1";
            model.VideoUrl = "aP6orw0M-bY";
            model.StartAt = "00:00:05";
            model.EndAt = "00:03:56";

            //Name:
            string aux = model.Name;
            model.Name = null;
            yield return new object[] { model.GetCopy() }; //null
            model.Name = "";
            yield return new object[] { model.GetCopy() }; //empty
            model.Name = "sdafsjfdhasdudfhuhwquheruwhewu sdfsakfuw dsjfnuwqh djfna fwuqdsjfuiqhweu sddjfn hqfsdfqliuhjsdafh";
            yield return new object[] { model.GetCopy() }; //tooLong
            model.Name = aux;

            //ArtistName:
            aux = model.ArtistName;
            model.ArtistName = null;
            yield return new object[] { model.GetCopy() }; //null
            model.ArtistName = "";
            yield return new object[] { model.GetCopy() }; //empty
            model.ArtistName = "sdafsjfdhasdudfhuhwquheruwhewu sdfsakfuw dsjfnuwqh djfna fwuqdsjfuiqhweu sddjfn hqfsdfqliuhjsdafh";
            yield return new object[] { model.GetCopy() }; //tooLong
            model.ArtistName = aux;

            //AlbumName:
            aux = model.AlbumName;
            model.AlbumName = "sdafsjfdhasdudfhuhwquheruwhewu sdfsakfuw dsjfnuwqh djfna fwuqdsjfuiqhweu sddjfn hqfsdfqliuhjsdafh";
            yield return new object[] { model.GetCopy() }; //tooLong
            model.AlbumName = aux;

            //VideoUrl
            aux = model.VideoUrl;
            model.VideoUrl = null;
            yield return new object[] { model.GetCopy() }; //null
            model.VideoUrl = "";
            yield return new object[] { model.GetCopy() }; //empty
            model.VideoUrl = "sdafsjfdhasdudfhuhwquheruwhewu";
            yield return new object[] { model.GetCopy() }; //tooLong
            model.VideoUrl = aux;

            //StartAt
            aux = model.StartAt;
            model.StartAt = null;
            yield return new object[] { model.GetCopy() }; //null
            model.StartAt = "";
            yield return new object[] { model.GetCopy() }; //empty
            model.StartAt = "0:0:5";
            yield return new object[] { model.GetCopy() }; //wrong
            model.StartAt = aux;

            //EndAt
            aux = model.EndAt;
            model.EndAt = null;
            yield return new object[] { model.GetCopy() }; //null
            model.EndAt = "";
            yield return new object[] { model.GetCopy() }; //empty
            model.EndAt = "0:0:5";
            yield return new object[] { model.GetCopy() }; //wrong
            model.EndAt = aux;

            //Incorrect Duration - zero seconds 
            model.StartAt = "00:03:23";
            model.EndAt = "00:03:23";
            yield return new object[] { model.GetCopy() };

            //Incorrect Duration  - negative seconds
            model.StartAt = "00:03:23";
            model.EndAt = "00:00:00";
            yield return new object[] { model.GetCopy() };

        }

    }
}
