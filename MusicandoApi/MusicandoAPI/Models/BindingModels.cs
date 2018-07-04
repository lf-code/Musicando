using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    //Binding models to be used by client to provide info to this api's actions.

    public class RegisterBM
    {
        [Required]
        [RegularExpression(@"^(?("")("".+?(?<!\\)""@)|(([0-9a-z]((\.(?!\.))|[-!#\$%&'\*\+/=\?\^`\{\}\|~\w])*)(?<=[0-9a-z])@))" +
                @"(?(\[)(\[(\d{1,3}\.){3}\d{1,3}\])|(([0-9a-z][-\w]*[0-9a-z]*\.)+[a-z0-9][\-a-z0-9]{0,22}[a-z0-9]))$", ErrorMessage = "InvalidEmail")]
        public string Email { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9_]{6,20}", ErrorMessage = "InvalidUsername")]
        public string Username { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9\._\%\+\-\!\?\@\#\$\&]{8,24}", ErrorMessage = "InvalidPassword")]
        public string Password { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9\._\%\+\-\!\?\@\#\$\&]{8,24}", ErrorMessage = "InvalidConfirmPassword")]
        public string ConfirmPassword { get; set; }

    }

    public class LoginBM
    {
        [Required]
        [RegularExpression(@"[A-Za-z0-9_]{6,20}", ErrorMessage = "InvalidUsername")]
        public string Username { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9\._\%\+\-\!\?\@\#\$\&]{8,24}", ErrorMessage = "InvalidPassword")]
        public string Password { get; set; }
    }

    public class PlaylistNameBM
    {
        [Required] 
        [RegularExpression(@"[A-Za-z\u00C0-\u00FC]{1}[A-Za-z0-9_\u00C0-\u00FC \(\)!?#&\-]{0,29}", ErrorMessage = "Invalid Playlist Name")]
        public string playlistName { get; set; }
    }


    public class PlayableSongBM
    {
        [Required]
        public string SongId { get; set; }

        [Required]
        public int Position { get; set; }
    }

    public class ChangePasswordBM
    {
        [Required]
        [RegularExpression(@"[A-Za-z0-9\._\%\+\-\!\?\@\#\$\&]{8,24}", ErrorMessage = "InvalidPassword")]
        public string CurrentPassword { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9\._\%\+\-\!\?\@\#\$\&]{8,24}", ErrorMessage = "InvalidConfirmPassword")]
        public string NewPassword { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9\._\%\+\-\!\?\@\#\$\&]{8,24}", ErrorMessage = "InvalidConfirmPassword")]
        public string ConfirmNewPassword { get; set; }

    }

    public class PrivateSongBM
    {
        [Required]
        [MinLength(1)]
        [MaxLength(30)]
        public string Name { get; set; }

        [Required]
        [MinLength(1)]
        [MaxLength(30)]
        public string ArtistName { get; set; }

        [MaxLength(30)]
        public string AlbumName { get; set; }

        [Required]
        [RegularExpression(".{1,15}", ErrorMessage = "InvalidVideoUrl")]
        public string VideoUrl { get; set; }


        [Required]
        [RegularExpression("0[0-9]:[0-5][0-9]:[0-5][0-9]", ErrorMessage = "InvalidStartAt")]
        public string StartAt { get; set; }

        [Required]
        [RegularExpression("0[0-9]:[0-5][0-9]:[0-5][0-9]", ErrorMessage = "InvalidEndAt")]
        public string EndAt { get; set; }

        public PrivateSongBM() { }
        public PrivateSongBM(string name, string artistName, string albumName, string videoUrl, string startAt, string endAt)
        {
            Name = name;
            ArtistName = artistName;
            AlbumName = albumName;
            VideoUrl = videoUrl;
            StartAt = startAt;
            EndAt = endAt;
        }

        //Used in Testing (MemberwiseClone can only be accessed here):
        public object GetCopy()
        {
            return this.MemberwiseClone();
        }
    }


}
