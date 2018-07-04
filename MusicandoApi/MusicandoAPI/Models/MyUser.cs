using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class MyUser : IdentityUser<Guid>
    {
        public List<Playlist> Playlists { get; set; }
        public List<PrivateSong> PrivateSongs { get; set; }

        public PrivateSongPlaylist PrivateSongPlaylist { get; set; }

        public MyUser() { }
    }

    public class MyRole : IdentityRole<Guid> { }
 
}
