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
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace MusicandoAPITests.Tests.AccountController
{
    public partial class AccountControllerTests : IClassFixture<MySetupFixture>
    {
        // TODO : TESTS for AccountController.ChangePassword
    }
}
