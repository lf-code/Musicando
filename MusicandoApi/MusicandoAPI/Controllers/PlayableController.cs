using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicandoAPI.Models;
using MusicandoAPI.Services;

namespace MusicandoAPI.Controllers
{
#if DEBUG
    [EnableCors("AllowSpecificOrigin")]
#endif
    public class PlayableController : Controller
    {

        private readonly MyDbContext _context;
        private readonly MyHelperService _helper;

        public PlayableController(MyDbContext context, MyHelperService helper)
        {
            _context = context;
            _helper = helper;
        }

        /// <summary>
        /// Gets Playable object associated with a private playlist, public playlist or an album.
        /// </summary>
        [HttpGet("/api/playable/{typeString}/{typeIdString}")]
        [ProducesResponseType(200, Type = typeof(PlayableVM))]
        [ProducesResponseType(404)]
        public IActionResult Get(string typeString, string typeIdString)
        {
            //Validate type as PlayableType and typeId as GUID id:
            if (!Enum.TryParse(typeof(PlayableType), typeString, true, out object typeObject) ||
                    !Guid.TryParse(typeIdString, out Guid typeId))
                return NotFound();

            PlayableType type = (PlayableType)typeObject;

            //Get IPlayable for the given type and id:
            IPlayable iPlayable = null;
            if (type == PlayableType.Playlist) //user playlist
                iPlayable = _helper.GetUserPlaylistById(this.HttpContext, typeId.ToString()); //Check if user is authenticated and owns such playlist.
            else if (type == PlayableType.PublicPlaylist) //public playlist
                iPlayable = _context.PublicPlaylists.FirstOrDefault(x => x.PublicPlaylistId == typeId);
            else if (type == PlayableType.Album) //album
                iPlayable = _context.Albums.Include(x1 => x1.Artist).FirstOrDefault(x => x.AlbumId == typeId);

            if (iPlayable == null)
                return NotFound(); //no playable was found

            //Load entry to access PlayableId
            _context.Entry(iPlayable).Reference(x => x.Playable).Load();

            //Load necessary related playable data (independent of playable type):
            iPlayable.Playable = _context.Playables
                .Include(x => x.PlayableSongs)
                    .ThenInclude(x => x.Song)
                        .ThenInclude(x => x.Video)
                .Include(x => x.PlayableSongs)
                    .ThenInclude(x => x.Song)
                        .ThenInclude(x => x.PublicSong)
                            .ThenInclude(x => x.Album)
                                .ThenInclude(x => x.Artist)
                .Include(x => x.PlayableSongs)
                    .ThenInclude(x => x.Song)
                        .ThenInclude(x => x.PrivateSong)
                .FirstOrDefault(x => x.PlayableId == iPlayable.Playable.PlayableId);

            PlayableVM playableVM = new PlayableVM(iPlayable);
            return Ok(playableVM);
        }

        /// <summary>
        /// Gets default Playable associated with default public playlist.
        /// </summary>
        [HttpGet("/api/playlist/default")]
        [ProducesResponseType(200, Type = typeof(PlayableVM))]
        [ProducesResponseType(404)]
        public IActionResult GetDefault()
        {
            return RedirectToAction("Get", new { typeString = "PublicPlaylist", typeIdString = "4d49139b-d0c0-4379-b961-68810eb2a8fa" });
        }
    }
}