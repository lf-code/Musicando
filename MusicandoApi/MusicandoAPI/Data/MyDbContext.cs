using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using MusicandoAPI.Models;

namespace MusicandoAPI.Models
{

    public class MyDbContext : IdentityDbContext<MyUser, MyRole, Guid>
    {
        public MyDbContext(DbContextOptions<MyDbContext> options)
            : base(options)
        {
        }

        public MyDbContext() { }

        public virtual DbSet<Artist> Artists { get; set; }

        public virtual DbSet<Song> Songs { get; set; }

        public virtual DbSet<Album> Albums { get; set; }

        public virtual DbSet<Video> Videos { get; set; }

        public virtual DbSet<Playlist> Playlists { get; set; }

        public virtual DbSet<PublicPlaylist> PublicPlaylists { get; set; }

        public virtual DbSet<PlayableSong> PlayableSongs { get; set; }

        public virtual DbSet<PrivateSong> PrivateSongs{ get; set; }

        public virtual DbSet<PublicSong> PublicSongs { get; set; }

        public virtual DbSet<Playable> Playables { get; set; }

        public virtual DbSet<PrivateSongPlaylist> PrivateSongPlaylists { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //PLAYABLESONG:
            modelBuilder.Entity<PlayableSong>().HasKey(x => new { x.PlayableId, x.SongId });

            //cascade only when playable is deleted. When private song is deleted restrict, and force playablesongs to deleted first
            //because when an user is deleted playable songs would cascade both from his private songs and his playlists)
            modelBuilder.Entity<PlayableSong>().HasOne( x => x.Song ).WithMany().IsRequired(true).OnDelete(DeleteBehavior.Restrict);

            //ARTIST
            modelBuilder.Entity<Artist>().HasOne(x=>x.PublicPlaylist).WithOne().IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            //PLAYABLE
            modelBuilder.Entity<Playable>().HasOne(x => x.Album).WithOne(y => y.Playable).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Playable>().HasOne(x => x.Playlist).WithOne(y => y.Playable).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Playable>().HasOne(x => x.PublicPlaylist).WithOne(y => y.Playable).IsRequired(false).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Playable>().Property(x => x.TypeId).HasComputedColumnSql("COALESCE(PlaylistId, PublicPlaylistId, AlbumId)");

            modelBuilder.Entity<Playable>().HasIndex(x => x.TypeId).IsUnique();

            //SONG
            modelBuilder.Entity<Song>().HasOne(x => x.PrivateSong).WithOne(y => y.Song).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Song>().HasOne(x => x.PublicSong).WithOne(y => y.Song).IsRequired(false).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Song>().Property(x => x.TypeId).HasComputedColumnSql("COALESCE(PrivateSongId, PublicSongId)");

            modelBuilder.Entity<Song>().HasIndex(x => x.TypeId).IsUnique();

            //PRIVATESONGSPLAYLIST
            modelBuilder.Entity<PrivateSongPlaylist>().HasKey(x => new { x.MyUserId, x.PlaylistId });
            modelBuilder.Entity<PrivateSongPlaylist>().HasOne(x => x.MyUser).WithOne( y => y.PrivateSongPlaylist).IsRequired(true).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PrivateSongPlaylist>().HasOne(x => x.Playlist).WithOne().IsRequired(true).OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PrivateSongPlaylist>().HasIndex(x => x.MyUserId).IsUnique();
            modelBuilder.Entity<PrivateSongPlaylist>().HasIndex(x => x.PlaylistId).IsUnique();
        }

    }
}
