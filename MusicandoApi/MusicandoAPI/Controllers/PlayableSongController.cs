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
    [Authorize]
#if DEBUG
    [EnableCors("AllowSpecificOrigin")]
#endif
    public class PlayableSongController : Controller
    {

        private readonly MyDbContext _context;
        private readonly MyHelperService _helper;

        public PlayableSongController(MyDbContext context, MyHelperService helper)
        {
            _context = context;
            _helper = helper;
        }

        /// <summary>
        /// Enables user to add multiple songs to a playlist,
        /// creating the corresponding PlayableSongs.
        /// </summary>
        [HttpPost("/api/playlist/{playlistIdString}/adicionarcancoes")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> CreateMultiple([FromBody] string[] songIdsStrings, string playlistIdString)
        {
            //validate the array of songIds:
            if (songIdsStrings == null || songIdsStrings.Length == 0 || songIdsStrings.Length >= 50)
                return NotFound();

            //validate songIds as valid GUID ids:
            Guid[] songIds = new Guid[songIdsStrings.Length];
            for (int i = 0; i < songIds.Length; i++)
            {
                if (!Guid.TryParse(songIdsStrings[i], out songIds[i]))
                    return NotFound();
            }

            //If any of the song ids doesn't exist, return 'NotFound':
            List<Song> songs = new List<Song>();
            foreach (Guid id in songIds)
            {
                Song s = _context.Songs.FirstOrDefault(x => x.SongId == id);
                if (s == null)
                    return NotFound();
                else
                    songs.Add(s);
            }

            //Find the playlist to which songs should be added:
            Playlist playlist = _helper.GetUserPlaylistById(this.HttpContext, playlistIdString);
            if (playlist == null)
                return NotFound();

            _context.Entry(playlist).Reference(x => x.Playable).Load();
            _context.Entry(playlist.Playable).Collection(x => x.PlayableSongs).Load();

            //Add songs by creating the corresponding PlayableSong objects:
            foreach (Song s in songs)
            {
                //check if the song already exists in playlist, if so, skip
                if (!playlist.PlayableSongs.Any(x => x.SongId == s.SongId)) 
                {
                    PlayableSong ps = new PlayableSong();
                    ps.PlayableId = playlist.Playable.PlayableId;
                    ps.Playable = playlist.Playable;
                    ps.SongId = s.SongId;
                    ps.Song = s;
                    ps.Position = playlist.PlayableSongs.Count(); //add at the end of playlist!
                    playlist.PlayableSongs.Add(ps);
                }
            }

            await _context.SaveChangesAsync();
            PlaylistBasicVM playlistVM = new PlaylistBasicVM { PlaylistId = playlist.PlaylistId };
            return Ok(playlistVM);
        }


        /// <summary>
        /// Enables user to remove a song from a playlist,
        /// deleting the corresponding PlayableSong.
        /// </summary>
        [HttpPost("/api/playlist/{playlistIdString}/remover/{songIdString}")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Remove(string playlistIdString, string songIdString)
        {
            //Validate string id as a valid GUID id:
            if (!Guid.TryParse(songIdString, out Guid songId))
                return NotFound();

            //Find the playlist:
            Playlist playlist = _helper.GetUserPlaylistById(this.HttpContext, playlistIdString);
            if (playlist == null)
                return NotFound();

            //Get PlayableSong, if it exists:
            _context.Entry(playlist).Reference(x => x.Playable).Load();
            _context.Entry(playlist.Playable).Collection(x => x.PlayableSongs).Load();
            PlayableSong playableSong = playlist.PlayableSongs.FirstOrDefault(x => x.SongId == songId);
            if (playableSong == null)
                return NotFound();

            //Update positions, every song that comes after the 
            //removed position should go back a position:
            int removedPosition = playableSong.Position;
            foreach (PlayableSong z in playlist.PlayableSongs)
                if (z.Position > removedPosition)
                    z.Position--;

            //Remove song, save changes:
            playlist.PlayableSongs.Remove(playableSong);
            await _context.SaveChangesAsync();

            PlaylistBasicVM playlistVM = new PlaylistBasicVM { PlaylistId = playlist.PlaylistId };

            return Ok(playlistVM);
        }


        /// <summary>
        /// Enables user to change song's position in a playlist,
        /// changing the corresponding PlayableSong.Position 
        /// </summary>
        [HttpPost("/api/playlist/{playlistIdString}/mudarposicao")]
        [ProducesResponseType(200, Type = typeof(PlaylistBasicVM))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> EditPosition(string playlistIdString, [FromBody] PlayableSongBM playableSongModel)
        {
            //Find the playlist:
            Playlist playlist = _helper.GetUserPlaylistById(this.HttpContext, playlistIdString);
            if (playlist == null)
                return NotFound();

            _context.Entry(playlist).Reference(x => x.Playable).Load();
            _context.Entry(playlist.Playable).Collection(x => x.PlayableSongs).Load();

            //Validate string id as a valid GUID id:
            if (!Guid.TryParse(playableSongModel.SongId, out Guid songId))
                return NotFound();
            
            //Find the PlayableSong:
            PlayableSong playableSong = playlist.PlayableSongs.FirstOrDefault(x => x.SongId == songId);
            if (playableSong == null)
                return NotFound();

            //Validate the new position:
            int wantedPosition = playableSongModel.Position;
            if (wantedPosition < 0 || wantedPosition >= playlist.PlayableSongs.Count)
                return NotFound();

            //Update positions of other songs in playlist:
            int currentPosition = playableSong.Position;
            if (wantedPosition < currentPosition)
            {
                foreach (PlayableSong z in playlist.PlayableSongs) //moves songs down
                    if (z.Position >= wantedPosition && z.Position < currentPosition)
                        z.Position++;
            }
            else if (wantedPosition > currentPosition)
            {
                foreach (PlayableSong z in playlist.PlayableSongs) //move songs up
                    if (z.Position <= wantedPosition && z.Position > currentPosition)
                        z.Position--;
            }
            
            //Edit song position and save:
            playableSong.Position = wantedPosition;
            await _context.SaveChangesAsync();
            PlaylistBasicVM playlistVM = new PlaylistBasicVM { PlaylistId = playlist.PlaylistId };

            return Ok(playlistVM);
        }


        /// <summary>
        /// Gets PlayableSong info for a isolated public song.
        /// (the song info so that it can be played, without being in a playlist)
        /// </summary>
        [HttpGet("/api/musica/publica/{songIdString}")]
        [AllowAnonymous]
        [ProducesResponseType(404)]
        [ProducesResponseType(200, Type = typeof(PlayableSongVM))]
        public IActionResult GetPublic(string songIdString)
        {
            // Validate string id as a valid GUID id:
            if (!Guid.TryParse(songIdString, out Guid songId))
                return BadRequest();

            // Search for the song, include all necessary info
            Song song = _context.Songs
                .Include(x => x.Video)
                .Include(y => y.PublicSong)
                    .ThenInclude(x => x.Album)
                        .ThenInclude(x => x.Artist)
                .Include(y => y.PrivateSong)
                .FirstOrDefault(x => x.SongId == songId);

            if (song == null)
                return NotFound();

            PlayableSongVM playalbeSong = new PlayableSongVM(song);
            return Ok(playalbeSong);
        }


        /// <summary>
        /// Gets PlayableSong info for a isolated private song.
        /// (the song info so that it can be played, without being in a playlist)
        /// Requires authentication.
        /// </summary>
        [HttpGet("/api/musica/privada/{privateSongIdString}")]
        [ProducesResponseType(200, Type = typeof(PlayableSongVM))]
        [ProducesResponseType(404)]
        public IActionResult GetPrivate(string privateSongIdString)
        {
            if (privateSongIdString == null || !Guid.TryParse(privateSongIdString, out Guid privateSongId))
                return NotFound();

            //Search for the user and include all the necessary info:
            MyUser user = _context.Users.Include(x => x.PrivateSongs)
                .ThenInclude(x => x.Song)
                .ThenInclude(y => y.Video)
                .FirstOrDefault(x => x.UserName == HttpContext.User.Identity.Name);

            if (user == null)
                return NotFound();

            //Search for the song in user's private songs
            PrivateSong privateSong = user.PrivateSongs.FirstOrDefault(x => x.PrivateSongId == privateSongId);

            if (privateSong == null)
                return NotFound();

            PlayableSongVM playableSong = new PlayableSongVM(privateSong.Song);

            return Ok(playableSong);
        }

    }
}