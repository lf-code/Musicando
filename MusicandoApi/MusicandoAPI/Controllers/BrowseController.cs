using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using Microsoft.EntityFrameworkCore;
using MusicandoAPI.Models;
using Microsoft.Extensions.Logging;

namespace MusicandoAPI.Controllers
{
    #if DEBUG
    [EnableCors("AllowSpecificOrigin")]  
    #endif
    public class BrowseController : Controller
    {
        private readonly MyDbContext _context;
        //private readonly ILogger _logger;

        public BrowseController(MyDbContext context /*, ILogger<BrowseController> logger */)
        {
            _context = context;
            //_logger = logger;
        }


        /// <summary>
        /// Gets basic info (id, name, all albums basic info) for all available Artists.
        /// </summary>
        [HttpGet("/api/browse/artistas")]
        [ProducesResponseType(200, Type = typeof(ArtistBasicVM[]))]
        public ActionResult GetArtists()
        {
            ArtistBasicVM[] artists = _context.Artists
                .Include(x => x.Albums)
                .Include(x => x.PublicPlaylist)
                .Select(x => new ArtistBasicVM(x)).ToArray();
            return Ok(artists);
        }


        /// <summary>
        /// Gets basic info (id, name, description) for all public playlists that should be displayed in browse.
        /// </summary>
        [HttpGet("/api/browse/playlists")]
        [ProducesResponseType(200, Type = typeof(PublicPlaylistBasicVM[]))]
        public IActionResult GetPublicPlaylists()
        {
            PublicPlaylistBasicVM[] publicPlaylists = _context.PublicPlaylists
                .Where(px => px.ShowInBrowse) //select only those which should be displayed in browse (i.e. are not hidden)
                .Select(x => new PublicPlaylistBasicVM(x)).ToArray();

            return Ok(publicPlaylists);
        }


        /// <summary>
        /// Gets info (songid, name, duration, position) about all tracks in a given album.
        /// </summary>
        [HttpGet("/api/browse/album/{albumId}")]
        [ProducesResponseType(404)]
        [ProducesResponseType(200, Type = typeof(AlbumTrackVM[]))]
        public IActionResult GetAlbumTracks(Guid albumId)
        {
            //search for the album by id and include all the necessary info
            Album a = _context.Albums
                .Include(x => x.Playable)
                    .ThenInclude(x => x.PlayableSongs)
                        .ThenInclude(s => s.Song)
                            .ThenInclude(s => s.Video)
                    .Include(s => s.PublicSongs)
                .FirstOrDefault(y => y.AlbumId == albumId);

            if (a == null)
                return NotFound();

            AlbumTrackVM[] albumTracks = a.PlayableSongs.Select(x => new AlbumTrackVM(x)).ToArray();

            return Ok(albumTracks);
        }


        //SEARCH:

        /// <summary>
        /// Gets the search results for the artists whose name contains the search expression.
        /// </summary>
        [HttpPost("/api/browse/procurar/artista")]
        [ProducesResponseType(400)]
        [ProducesResponseType(200, Type = typeof(SearchResultVM[]))]
        public IActionResult SearchArtist([FromBody] string searchText)
        {
            if(!IsValidSearchText(searchText))
                return BadRequest();

            SearchResultVM[] results = Search<Artist>(_context.Artists, searchText);


            return Ok(results);
        }


        /// <summary>
        /// Gets the search results for the albums whose name contains the search expression.
        /// </summary>
        [HttpPost("/api/browse/procurar/album")]
        [ProducesResponseType(400)]
        [ProducesResponseType(200, Type = typeof(SearchResultVM[]))]
        public IActionResult SearchAlbum([FromBody] string searchText)
        {
            if (!IsValidSearchText(searchText))
                return BadRequest();

            SearchResultVM[] results = Search<Album>(_context.Albums, searchText);

            return Ok(results);
        }


        /// <summary>
        /// Gets the search results for the public songs whose name contains the search expression.
        /// </summary>
        [HttpPost("/api/browse/procurar/cancao")]
        [ProducesResponseType(400)]
        [ProducesResponseType(200, Type = typeof(SearchResultVM[]))]
        public IActionResult SearchSong([FromBody] string searchText)
        {
            if (!IsValidSearchText(searchText))
                return BadRequest();

            SearchResultVM[] results = Search<PublicSong>(_context.PublicSongs, searchText);

            return Ok(results);
        }


        /// <summary>
        /// Helper method: it returns info of all objects whose 'Name' contains a given expression.
        /// Objects should implement ISearcheable, to ensure they have a 'Name' property.
        /// </summary>
        private SearchResultVM[] Search<T>(DbSet<T> set, string searchText) where T : class, ISearchable
        {
            // search for all T : ISearchable, whose name contains the expression in 'searchText'
            searchText = searchText?.Trim().ToUpper();

            //aux function that loads additional info for public songs results, 
            //and creates a search result for each ISearchable that matches the searchText
            Func<T, SearchResultVM> f = (x) => {
                if (x is PublicSong)
                {
                    _context.Entry((x as PublicSong)).Reference(h => h.Album).Load();
                    _context.Entry((x as PublicSong)).Reference(h => h.Song).Load();
                }
                return new SearchResultVM(x);
            };

            List<SearchResultVM> results =
                set.Where(a => a.Name.ToUpper().Contains(searchText))
                .Select<T,SearchResultVM>(f)
                .ToList();

            return results.ToArray();
        }


        /// <summary>
        /// Helper Method: it checks whether or not a string is a valid search expression.
        /// </summary>
        private bool IsValidSearchText(string searchText)
        {
            //ad-hoc rules for valid search text:
            return searchText != null && searchText.Length >= 3 && searchText.Length <= 50;
        }

    }
}
