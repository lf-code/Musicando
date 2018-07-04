using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class PublicPlaylist : IPlayable
    {
        public Guid PublicPlaylistId { get; set; }
        public string Name { get; set; }
        public string PlaylistDescription { get; set; }
        public bool ShowInBrowse { get; set; }

        //NAVIGATION:

        public Playable Playable { get; set; }

        public Guid TypeId => PublicPlaylistId;
        public PlayableType Type => PlayableType.PublicPlaylist;

        [NotMapped]
        public string CreatorName => "Musicando";

        [NotMapped]
        public List<PlayableSong> PlayableSongs => Playable?.PlayableSongs;

    }
  
}
