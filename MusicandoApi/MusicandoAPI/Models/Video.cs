using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MusicandoAPI.Models
{
    public class Video
    {
        public Guid VideoId { get; set; }
        public string VideoUrl { get; set; }
        public int StartSec { get; set; }
        public int EndSec { get; set; }
        public string Duration { get; set; }
        public bool IsLive { get; set; }

        public Guid SongId { get; set; }
        public Song Song { get; set; }

        public static string GetDuration(int startSec, int endSec)
        {
            if (startSec < 0 || startSec >= endSec)
                return null;

            if (endSec - startSec >= 60 * 60) //if more than one hour, no duration representation
                return "--:--";

            return TimeSpan.FromSeconds(endSec - startSec).ToString(@"mm\:ss");

        }

        public static int GetTimeInSeconds(string timeString)
        {
            //Validate string:
            if (!(new Regex("0[0-9]:[0-5][0-9]:[0-5][0-9]", RegexOptions.IgnoreCase)).Match(timeString).Success)
                return -1;
            return (int)TimeSpan.Parse(timeString).TotalSeconds;
        }

        public static string GetTimeInString(int secs)
        {
            return TimeSpan.FromSeconds(secs).ToString(@"hh\:mm\:ss");
        }
    }
}
