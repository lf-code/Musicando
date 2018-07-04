using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class Playlist : IPlayable
    {
        public Guid PlaylistId { get; set; }
        public string Name { get; set; } //Also Playable.Name

        public Guid MyUserId { get; set; }
        public MyUser MyUser { get; set; }

        public Playable Playable { get; set; }

        //IPlayable INTERFACE:

        public Guid TypeId => PlaylistId;
        public PlayableType Type => PlayableType.Playlist;

        [NotMapped]
        public string CreatorName => MyUser?.UserName;

        [NotMapped]
        public List<PlayableSong> PlayableSongs => Playable?.PlayableSongs;

        public Playlist() { }

        public Playlist(string name, MyUser u)
        {
            this.PlaylistId = Guid.NewGuid();
            this.Name = name;
            this.MyUser = u;
            //create Playable:
            this.Playable = new Playable();
            this.Playable.PlayableSongs = new List<PlayableSong>();
            this.Playable.PlaylistId = this.PlaylistId;
        }
    }

    public class PrivateSongPlaylist
    {
        public Guid MyUserId { get; set; }
        public MyUser MyUser { get; set; }

        public Guid PlaylistId { get; set; }
        public Playlist Playlist { get; set; }
    }

}
