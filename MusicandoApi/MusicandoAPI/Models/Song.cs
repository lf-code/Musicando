using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class Song
    {
        public Guid SongId { get; set; }

        public Video Video { get; set; }

        public Guid? PrivateSongId { get; set; }
        public PrivateSong PrivateSong { get; set; }

        public Guid? PublicSongId { get; set; }
        public PublicSong PublicSong { get; set; }

        public Guid TypeId { get; set; }

        [NotMapped]
        public ISongInfo SongInfo
        {
            get {
                if (this.TypeId == this.PrivateSongId)
                    return this.PrivateSong;
                else if (this.TypeId == this.PublicSongId)
                    return this.PublicSong;
                return null;
            }
        }
    }

    public class PrivateSong : ISongInfo
        {
        public Guid PrivateSongId { get; set; }
        public string Name { get; set; }
        public string ArtistName { get; set; }
        public string AlbumName { get; set; }

        public Guid MyUserId { get; set; }
        public MyUser MyUser { get; set; }

        public Song Song { get; set; }

        [NotMapped]
        public string AlbumImgLink => null;
    }

    public class PublicSong : ISongInfo, ISearchable
    {
        public Guid PublicSongId { get; set; }
        public string Name { get; set; }

        public Guid AlbumId { get; set; }
        public Album Album { get; set; }

        public Song Song { get; set; }

        [NotMapped]
        public string ArtistName => this.Album?.Artist?.Name;
        [NotMapped]
        public string AlbumName => this.Album?.Name;
        [NotMapped]
        public string AlbumImgLink => this.Album?.ImgLink;
    }

}
