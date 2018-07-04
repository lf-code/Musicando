using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    //Models used to send structured information to client app.

    public class PlayableVM
    {
        public string TypeId { get; set; }
        public string PlayableId { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string CreatorName { get; set; }
        public PlayableSongVM[] PlayableSongs { get; set; }

        public PlayableVM() { }

        public PlayableVM(IPlayable p)
        {
            this.TypeId = p.TypeId.ToString();
            this.Name = p.Name;
            this.PlayableId = p.Playable.PlayableId.ToString();
            this.Type = p.Type.ToString();
            this.CreatorName = p.CreatorName;
            this.PlayableSongs = p.PlayableSongs.Select(ps => new PlayableSongVM(ps)).ToArray();
        }

    }

    public class PlayableSongVM
    {
        public string SongId { get; set; }

        public bool IsPrivate {get;set;}

        public string Name { get; set; }
        public string ArtistName { get; set; }
        public string AlbumName { get; set; }
        public string AlbumImgLink { get; set; }

        public string VideoUrl { get; set; }
        public string Duration { get; set; }
        public string StartSec { get; set; }
        public string EndSec { get; set; }

        public int Position { get; set; }

        public PlayableSongVM() { }

        public PlayableSongVM(Song s, int position = -1)
        {
            this.SongId = s.SongId.ToString();
            this.IsPrivate = s.PrivateSongId != null;
            this.Name = s.SongInfo.Name;
            this.ArtistName = s.SongInfo.ArtistName;
            this.AlbumName = s.SongInfo.AlbumName;

            this.AlbumImgLink = s.SongInfo.AlbumImgLink;

            if (s.Video != null)
            {
                this.VideoUrl = s.Video.VideoUrl;
                this.Duration = s.Video.Duration;
                this.StartSec = s.Video.StartSec.ToString();
                this.EndSec = s.Video.EndSec.ToString();
            }

            this.Position = position;
        }

        public PlayableSongVM(PlayableSong sp) : this(sp.Song, sp.Position) { }

    }

    public class PlaylistBasicVM
    {
        public Guid PlaylistId { get; set; }
        public string Name { get; set; }
        public string CreatorName { get; set; }

        public PlaylistBasicVM() { }

        public PlaylistBasicVM(Playlist pl)
        {
            this.PlaylistId = pl.PlaylistId;
            this.Name = pl.Name;
            this.CreatorName = pl.CreatorName;
        }

    }

    public class PublicPlaylistBasicVM
    {
        public Guid PublicPlaylistId { get; set; }
        public string Name { get; set; }
        public string PlaylistDescription { get; set; }

        public PublicPlaylistBasicVM() { }

        public PublicPlaylistBasicVM(PublicPlaylist pl)
        {
            this.PublicPlaylistId = pl.PublicPlaylistId;
            this.Name = pl.Name;
            this.PlaylistDescription = pl.PlaylistDescription;
        }
    }

    public class ArtistBasicVM
    {

        public string ArtistId { get; set; }
        public string Name { get; set; }
        public string HitsPlaylistId { get; set; }
        public AlbumBasicVM[] Albums { get; set; }

        public ArtistBasicVM() { }


        public ArtistBasicVM(Artist a)
        {
            this.Name = a.Name;
            this.ArtistId = a.ArtistId.ToString();
            this.Albums = a.Albums.Select(x => new AlbumBasicVM(x)).ToArray();
            this.HitsPlaylistId = a.PublicPlaylist.PublicPlaylistId.ToString();
        }

    }

    public class AlbumBasicVM
    {
        public string AlbumId { get; set; }
        public string Name { get; set; }
        public string ImgLink { get; set; }
        public AlbumTrackVM Tracks { get; set; }

        public AlbumBasicVM() { }

        public AlbumBasicVM(Album x)
        {
            this.AlbumId = x.AlbumId.ToString();
            this.Name = x.Name;
            this.ImgLink = x.ImgLink;
            this.Tracks = null; //Load from server as needed
        }

    }

    public class AlbumTrackVM
    {
        public string SongId { get; set; }
        public string Name { get; set; }
        public string Duration { get; set; }
        public int Position { get; set; }

        public AlbumTrackVM() { }

        public AlbumTrackVM(PlayableSong ps)
        {
            this.SongId = ps.Song.SongId.ToString();
            this.Name = ps.Song.PublicSong?.Name;
            this.Duration = ps.Song.Video?.Duration;
            this.Position = ps.Position;
        }

    }

    public class PublicSongBasicVM
    {
        public string SongId { get; set; }
        public string Name { get; set; }
        public string ArtistName { get; set; }
        public string AlbumImgLink { get; set; }
        public string AlbumName { get; set; }

        public PublicSongBasicVM() { }

        public PublicSongBasicVM(PublicSong s)
        {
            this.SongId = s.Song.SongId.ToString();
            this.Name = s.Name;
            this.ArtistName = s.Album.Artist.Name;
            this.AlbumImgLink = s.Album.ImgLink;
            this.AlbumName = s.Album.Name;
        }
    }

    public class PrivateSongBasicVM
    {
        public string PrivateSongId { get; set; }
        public string SongId { get; set; }
        public string Name { get; set; }

        public PrivateSongBasicVM() { }

        public PrivateSongBasicVM(PrivateSong s)
        {
            this.PrivateSongId = s.PrivateSongId.ToString();
            this.SongId = s.Song.SongId.ToString();
            this.Name = s.Name;
        }
    }

    public class SearchResultVM
    {
        public string Type { get; set; }
        public string Name { get; set; }
        public string ArtistId { get; set; }
        public string AlbumId { get; set; }
        public string SongId { get; set; }

        public SearchResultVM() { }

        public SearchResultVM(ISearchable x)
        {
            this.Name = x.Name;
            if (x is Artist)
            {
                this.Type = "Artista";
                this.ArtistId = ((Artist)x).ArtistId.ToString();
            }
            else if (x is Album)
            {
                this.Type = "Album";
                this.ArtistId = ((Album)x).ArtistId.ToString();
                this.AlbumId = ((Album)x).AlbumId.ToString();
            }
            else if (x is PublicSong)
            {
                this.Type = "Canção";
                this.ArtistId = ((PublicSong)x).Album.ArtistId.ToString();
                this.AlbumId = ((PublicSong)x).AlbumId.ToString();
                this.SongId = ((PublicSong)x).Song.SongId.ToString();
            }
            else throw new Exception($"Invalid ISearchable: {x.GetType().ToString()}");
        }

    }

    public class UserBasicVM
    {
        public string Username { get; set; }

        public UserBasicVM() { }

        public UserBasicVM(string username)
        {
            this.Username = username;
        }
    }

    public class RegisterErrorVM
    {
        public bool InvalidEmail { get; set; }
        public bool InvalidUsername { get; set; }
        public bool InvalidPassword { get; set; }
        public bool InvalidConfirmPassword { get; set; }
        public bool ExistingEmail { get; set; }
        public bool ExistingUsername { get; set; }
        public bool PasswordsDoNotMatch { get; set; }


        public RegisterErrorVM()
        {
            InvalidEmail = false;
            InvalidUsername = false;
            InvalidPassword = false;
            InvalidConfirmPassword = false;
            ExistingEmail = false;
            ExistingUsername = false;
            PasswordsDoNotMatch = false;
        }

    }

}
