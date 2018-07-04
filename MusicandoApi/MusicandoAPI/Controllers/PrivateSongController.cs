using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using MusicandoAPI.Models;

namespace MusicandoAPI.Controllers
{
    [Authorize]
#if DEBUG
    [EnableCors("AllowSpecificOrigin")]
#endif
    public class PrivateSongController : Controller
    {

        private readonly MyDbContext _context;

        public PrivateSongController(MyDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets basic info for all user's private songs (id, name).
        /// </summary>
        [HttpGet("/api/musicasprivadas")]
        [ProducesResponseType(200, Type = typeof(PrivateSongBasicVM[]))]
        [ProducesResponseType(404)]
        public IActionResult Get()
        {
            //find user by name, include private songs
            MyUser user = _context.Users 
                .Include( y => y.PrivateSongs)
                    .ThenInclude(x => x.Song)
                .FirstOrDefault(x => x.UserName == HttpContext.User.Identity.Name);

            if (user == null)
                return NotFound();

            PrivateSongBasicVM[] a = user.PrivateSongs.Select(x => new PrivateSongBasicVM(x)).ToArray();

            return Ok(a);
        }


        /// <summary>
        /// Gets complete info about a private song (for editing).
        /// </summary>
        [HttpGet("/api/musicasprivadas/info/{privateSongIdString}")]
        [ProducesResponseType(200, Type = typeof(PrivateSongBasicVM[]))]
        [ProducesResponseType(404)]
        public IActionResult GetInfo(string privateSongIdString)
        {
            // Validate string id as GUID id
            if (privateSongIdString == null || !Guid.TryParse(privateSongIdString, out Guid privateSongId))
                return NotFound();

            MyUser user = _context.Users
                .Include(x => x.PrivateSongs)
                    .ThenInclude(x => x.Song)
                        .ThenInclude(s => s.Video)
                .FirstOrDefault(x => x.UserName == HttpContext.User.Identity.Name);
            if (user == null) 
                return NotFound();

            PrivateSong pvs = user.PrivateSongs.FirstOrDefault(x => x.PrivateSongId == privateSongId);
            if (pvs == null)
                return NotFound(); //private song id not found in authenticated user

            //Build object with all info about the requested private song
            PrivateSongBM PrivateSongInfo = new PrivateSongBM();

            PrivateSongInfo.ArtistName = pvs.ArtistName;
            PrivateSongInfo.AlbumName = pvs.AlbumName;
            PrivateSongInfo.Name = pvs.Name;

            PrivateSongInfo.VideoUrl = pvs.Song.Video.VideoUrl;
            PrivateSongInfo.StartAt = Video.GetTimeInString(pvs.Song.Video.StartSec);
            PrivateSongInfo.EndAt = Video.GetTimeInString(pvs.Song.Video.EndSec); ;

            return Ok(PrivateSongInfo);
        }




        /// <summary>
        /// Creates a private song for the authenticated user with the provided song info.
        /// </summary>
        [HttpPost("/api/musicasprivadas/criar")]
        [ProducesResponseType(200, Type = typeof(PrivateSongBasicVM))]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Create([FromBody] PrivateSongBM privateSongModel)
        {
            //automatically validate all input with model binding
            if (!ModelState.IsValid)
                return BadRequest();
            
            //get authenticated user
            MyUser user = _context.Users.FirstOrDefault(x => x.UserName == HttpContext.User.Identity.Name);
            if (user == null)
                return NotFound();
            _context.Entry(user).Reference(x => x.PrivateSongPlaylist).Load();

            // Create private song object:
            PrivateSong pvs = new PrivateSong();
            pvs.PrivateSongId = Guid.NewGuid();

            pvs.MyUser = user;

            pvs.ArtistName = privateSongModel.ArtistName;
            pvs.AlbumName = privateSongModel.AlbumName;
            pvs.Name = privateSongModel.Name;

            Video v = new Video();
            v.VideoId = Guid.NewGuid();
            v.VideoUrl = privateSongModel.VideoUrl;
            v.IsLive = false; //not implemented yet, default to false

            v.StartSec = Video.GetTimeInSeconds(privateSongModel.StartAt);
            v.EndSec = Video.GetTimeInSeconds(privateSongModel.EndAt);
            v.Duration = Video.GetDuration(v.StartSec, v.EndSec);
            if (v.Duration == null)
                return BadRequest(); //invalid video duration

            Song song = new Song();
            song.SongId = Guid.NewGuid();

            song.PrivateSong = pvs;
            song.PrivateSongId = pvs.PrivateSongId;

            v.Song = song;
            song.Video = v;

            //Add private song to private song's playlist:
            Playable p = _context.Playables.FirstOrDefault(y => y.PlaylistId == user.PrivateSongPlaylist.PlaylistId);
            PlayableSong ps = new PlayableSong();
            ps.PlayableId = p.PlayableId;
            ps.Playable = p;
            ps.SongId = song.SongId;
            ps.Song = song;
            ps.Position = _context.Entry(p).Collection( x=> x.PlayableSongs).Query().Count();

            //Add to data context and save:
            _context.Songs.Add(song);
            _context.Videos.Add(v);
            _context.PrivateSongs.Add(pvs);
            _context.PlayableSongs.Add(ps);
            await _context.SaveChangesAsync();

            PrivateSongBasicVM privateSongVM = new PrivateSongBasicVM(pvs);
            return Ok(privateSongVM);
        }


        /// <summary>
        /// Allows user to edit info of a previously created private song.
        /// </summary>
        [HttpPost("/api/musicasprivadas/editar/{privateSongIdString}")]
        [ProducesResponseType(200, Type = typeof(PrivateSongBasicVM))]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Edit(string privateSongIdString, [FromBody] PrivateSongBM privateSongModel)
        {
            //validate the new info
            if (!ModelState.IsValid)
                return BadRequest();
            
            //validate provided private song id as a valid GUID id
            if (privateSongIdString == null || !Guid.TryParse(privateSongIdString, out Guid privateSongId))
                return NotFound();

            MyUser user = _context.Users.Include(x => x.PrivateSongs).ThenInclude(x => x.Song).ThenInclude(s=> s.Video).FirstOrDefault(x => x.UserName == HttpContext.User.Identity.Name);
            if (user == null)
                return NotFound();

            //try to find private song in authenticated user private songs 
            //(do not search outside current user, as any user is only allowed to change his own songs)
            PrivateSong privateSong = user.PrivateSongs.FirstOrDefault(x => x.PrivateSongId == privateSongId);
            if (privateSong == null)
                return NotFound();

            //Edit every field, every field must be provided even if unchanged
            privateSong.ArtistName = privateSongModel.ArtistName;
            privateSong.AlbumName = privateSongModel.AlbumName;
            privateSong.Name = privateSongModel.Name;

            privateSong.Song.Video.VideoUrl = privateSongModel.VideoUrl;

            privateSong.Song.Video.StartSec = Video.GetTimeInSeconds(privateSongModel.StartAt);
            privateSong.Song.Video.EndSec = Video.GetTimeInSeconds(privateSongModel.EndAt);
            privateSong.Song.Video.Duration = Video.GetDuration(privateSong.Song.Video.StartSec, privateSong.Song.Video.EndSec);

            if (privateSong.Song.Video.Duration == null)
                return BadRequest(); //invalid video duration

            await _context.SaveChangesAsync();

            PrivateSongBasicVM privateSongVM = new PrivateSongBasicVM(privateSong);

            return Ok(privateSongVM);
        }

        /// <summary>
        /// Allows user to delete one of its private songs.
        /// </summary>
        [HttpPost("/api/musicasprivadas/apagar/{privateSongIdString}")]
        [ProducesResponseType(200, Type = typeof(PrivateSongBasicVM))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(string privateSongIdString)
        {
            //validate provided private song id as a valid GUID id
            if (privateSongIdString == null || !Guid.TryParse(privateSongIdString, out Guid privateSongId))
                return NotFound();

            MyUser user = _context.Users.Include(x => x.PrivateSongs).ThenInclude(x => x.Song).ThenInclude(s => s.Video).FirstOrDefault(x => x.UserName == HttpContext.User.Identity.Name);
            if (user == null)
                return NotFound();

            PrivateSong privateSong = user.PrivateSongs.FirstOrDefault(x => x.PrivateSongId == privateSongId);
            if (privateSong == null)
                return NotFound();

            //delete all playableSongs with such song first! 
            //(song and video will cascade, but playablesong restricts, to avoid cycles when deleting an user
            // as user playlists and user privates songs cascade, and both would cause their playable songs to cascade)
            var toDelete = _context.PlayableSongs.Where(x => x.SongId == privateSong.Song.SongId);
            _context.PlayableSongs.RemoveRange(toDelete);

            //remove privateSong and save changes:
            user.PrivateSongs.Remove(privateSong);
            await _context.SaveChangesAsync();

            PrivateSongBasicVM privateSongVM = new PrivateSongBasicVM(privateSong);
            //client needs ids, set name to null so client knows the private song was deleted:
            privateSongVM.Name = null;

            return Ok(privateSongVM);
        }
    }
}