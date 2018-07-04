using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MusicandoAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Services
{
    /// <summary>
    /// This service provides a few helper methods that are used by more than one controller. 
    /// </summary>
    public class MyHelperService
    {
        /* https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-2.1 */

        private readonly MyDbContext _context;

        public MyHelperService(MyDbContext context)
        {
            _context = context;
        }


        /// <summary>
        /// Gets currently authenticated user, and optionally includes his playlists.
        /// Returns null if user is not authenticated.
        /// </summary>
        public MyUser GetAuthUser(HttpContext httpContext, bool includePlaylists = false)
        {
            //User not authenticated, return null:
            if (!httpContext.User.Identity.IsAuthenticated)
                return null;

            if (includePlaylists)
                return _context.Users.Include(x => x.Playlists).FirstOrDefault(x => x.UserName == httpContext.User.Identity.Name);
            else
                return _context.Users.FirstOrDefault(x => x.UserName == httpContext.User.Identity.Name);
        }


        /// <summary>
        /// Gets a playlist, by id, for an authenticated user.
        /// Returns null if user is not authenticated, id is not valid or playlist does not exist in user's playlists.
        /// </summary>
        public Playlist GetUserPlaylistById(HttpContext httpContext, string playlistIdString)
        {
            //Validate string id as GUID id:
            if (!Guid.TryParse(playlistIdString, out Guid playlistId))
                return null;

            MyUser user = GetAuthUser(httpContext, true);
            if (user == null)
                return null;

            //playlist has to exist in authenticated user playlists:
            //(exclude playlist of private songs)
            _context.Entry(user).Reference(x => x.PrivateSongPlaylist).Load();
            Playlist playlist = user.Playlists
                .FirstOrDefault(p => p.PlaylistId == playlistId && playlistId != user.PrivateSongPlaylist.PlaylistId);
            return playlist;
        }
    }
}
