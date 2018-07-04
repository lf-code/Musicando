using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class Album : IPlayable, ISearchable
    {
        public Guid AlbumId { get; set; }
        public string Name { get; set; }
        public string ImgLink { get; set; }

        //NAVIGATION:

        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }

        public List<PublicSong> PublicSongs { get; set; }

        public Playable Playable { get; set; }

        public Guid TypeId => AlbumId;
        public PlayableType Type => PlayableType.Album;

        [NotMapped]
        public string CreatorName => Artist?.Name;

        [NotMapped]
        public List<PlayableSong> PlayableSongs => Playable?.PlayableSongs;
    }

}
