using MusicandoAPI.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class Artist : ISearchable
    {
        public Guid ArtistId { get; set; }
        public string Name { get; set; }

        //NAVIGATION:

        public List<Album> Albums { get; set; }

        public Guid? PublicPlaylistId { get; set; }
        public PublicPlaylist PublicPlaylist { get; set; }

    }
 
}
