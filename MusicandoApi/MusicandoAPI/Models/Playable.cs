using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public enum PlayableType
    {
        Album = 1763354, Playlist = 21412, PublicPlaylist = 3435411, PrivateSongPlaylist = 213123
    }

    public class Playable
    {
        public Guid PlayableId { get; set; }

        public List<PlayableSong> PlayableSongs { get; set; }

        public Guid? PlaylistId { get; set; }
        public Playlist Playlist { get; set; }

        public Guid? AlbumId { get; set; }
        public Album Album { get; set; }

        public Guid? PublicPlaylistId { get; set; }
        public PublicPlaylist PublicPlaylist { get; set; }

        public Guid TypeId { get; set; }

    }
}
