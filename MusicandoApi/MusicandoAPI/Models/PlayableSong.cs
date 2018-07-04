using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class PlayableSong 
    {
        public Guid SongId { get; set; }
        public Song Song { get; set; }

        public Guid PlayableId { get; set; }
        public Playable Playable { get; set; }

        public int Position { get; set; }
    }

}
