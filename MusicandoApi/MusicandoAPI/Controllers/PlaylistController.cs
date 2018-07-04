using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using MusicandoAPI.Models;
using MusicandoAPI.Services;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace MusicandoAPI.Controllers
{
    [Authorize]
#if DEBUG
    [EnableCors("AllowSpecificOrigin")]
#endif
    public class PlaylistController : Controller
    {
        private readonly MyDbContext _context;
        private readonly MyHelperService _helper;

        public PlaylistController(MyDbContext context, MyHelperService helper)
        {
            _context = context;
            _helper = helper;
        }

        /// <summary>
        /// Gets basic info (id, name) of all user's private playlists
        /// (excluding the playlist of private songs).
        /// </summary>
        [HttpGet]
        [Route("/api/playlists")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM[]))]
        [ProducesResponseType(401)]
        public IActionResult GetAll()
        {
            MyUser user = _helper.GetAuthUser(this.HttpContext, true);
            if (user == null)
                return Unauthorized();

            //Exclude the playlist of private songs:
            _context.Entry(user).Reference(x => x.PrivateSongPlaylist).Load();
            PlaylistBasicVM[] playlists =
                user.Playlists
                .Where(x => x.PlaylistId != user.PrivateSongPlaylist.PlaylistId)
                .Select(p => new PlaylistBasicVM(p)).ToArray();

            return Ok(playlists);
        }


        /// <summary>
        /// Gets basic info (name and id) user's playlist of private songs.
        /// </summary>
        [HttpGet("/api/playlists/musicasprivadas")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(401)]
        public IActionResult GetPrivateSongsPlaylist()
        {
            MyUser user = _helper.GetAuthUser(this.HttpContext, true);
            if (user == null)
                return Unauthorized();

            //load relevant info from context:
            _context.Entry(user).Reference(x => x.PrivateSongPlaylist).Load();
            _context.Entry(user.PrivateSongPlaylist).Reference(x => x.Playlist).Load();
            PlaylistBasicVM playlist = new PlaylistBasicVM(user.PrivateSongPlaylist.Playlist);

            return Ok(playlist);
        }


        /// <summary>
        /// Enables user to create a new playlist.
        /// </summary>
        [HttpPost("/api/playlists/criar")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Create([FromBody] PlaylistNameBM playlistNameModel)
        {
            

            //validate the name of the playlist
            if (!ModelState.IsValid)
                return BadRequest();

            MyUser user = _helper.GetAuthUser(this.HttpContext, true);
            if (user == null)
                return Unauthorized();

            //TODO : there must be a limit for the number of playlists that an user may have.
            //Temporary hack: 
            if (user.Playlists.Count() == 20)
                return BadRequest("Too many playlists.");
            
            //create new playlist, add it to user's playlists, save context async:
            Playlist playlist = new Playlist(playlistNameModel.playlistName, user);
            user.Playlists.Add(playlist);
            await _context.SaveChangesAsync();

            PlaylistBasicVM playlistVM = new PlaylistBasicVM(playlist);

            return Ok(playlistVM);
        }

        /// <summary>
        /// Allows user to edit a previously created playlist, i.e. change playlist's name.
        /// </summary>
        [HttpPost("/api/playlists/editar/{playlistIdString}")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Edit([FromBody] PlaylistNameBM newName, string playlistIdString)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            Playlist playlist = _helper.GetUserPlaylistById(this.HttpContext, playlistIdString);
            if (playlist == null)
                return NotFound();

            //change playlist's name, save context:
            playlist.Name = newName.playlistName;
            await _context.SaveChangesAsync();

            PlaylistBasicVM playlistVM = new PlaylistBasicVM(playlist);

            return Ok(playlistVM);
        }


        /// <summary>
        /// Enables user to delete one of his user playlists.
        /// </summary>
        [HttpPost("/api/playlists/apagar/{playlistIdString}")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(string playlistIdString)
        {
            Playlist playlist = _helper.GetUserPlaylistById(this.HttpContext, playlistIdString);
            if (playlist == null)
                return NotFound();

            //remove playlist, save context:
            _context.Playlists.Remove(playlist);
            await _context.SaveChangesAsync();

            //return playlistBasicVM with null name,
            //to inform client that the playlist was deleted
            PlaylistBasicVM playlistVM = new PlaylistBasicVM();
            playlistVM.PlaylistId = playlist.PlaylistId;

            return Ok(playlistVM);
        }

    }
}
