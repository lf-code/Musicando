using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public interface IPlayable 
    {
        Guid TypeId { get; }
        Playable Playable { get; set; }
        string Name { get; }
        PlayableType Type { get; }
        string CreatorName { get; }
        List<PlayableSong> PlayableSongs { get; }
    }

    public interface ISongInfo
    {
        string Name { get; }
        string ArtistName { get; }
        string AlbumName { get; }
        string AlbumImgLink { get; }
    };

    public interface ISearchable
    {
        string Name { get; }
    }

}
