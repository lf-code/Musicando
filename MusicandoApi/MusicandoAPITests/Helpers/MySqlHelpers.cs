using MusicandoAPI.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;

namespace MusicandoAPITests
{
    class MySqlHelpers
    {

        #region All

        private static string connectionString = "Server = (localdb)\\MSSQLLocalDB; Database=MusicandoTesting; Trusted_Connection = True; ";

        public static bool CompareResultWithDB<T>(string queryString, T result)
        {
            return CompareResultsWithDB(queryString, new T[] { result }, null);
        }

        public static bool CompareResultsWithDB<T>(string queryString, T[] results, Action<T[]> sortAction)
        {
            //'RESULTS' MUST BE SORTED IN THE SAME ORDER AS IN DB STORED PROCEDURE!
            if(sortAction != null)
                sortAction(results);

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Connection.Open();
                var reader = command.ExecuteReader();
                int k = 0;
                while(reader.Read()) //advance for first row (in this case single row)
                {
                    T result = results[k++];
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        string columnName = reader.GetName(i);
                        string dbValue = reader.IsDBNull(i) ? null : reader.GetValue(i).ToString();
                        string resultValue = result.GetType().GetProperty(columnName).GetValue(result)?.ToString();
                        if (resultValue != dbValue)
                            return false;
                    }
                }
                if (k < results.Length)
                    return false;
            }
            return true;
        }


        private static string GetStringValueFromDatabase(string queryString)
        {
            string s = null;
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Connection.Open();
                var reader = command.ExecuteReader();
                reader.Read();
                s = reader[0].ToString();
            }
            return s;
        }

        #endregion


        #region GetRandomId


        private static string GetRandomId(string columnName, string tableName, string userName = null)
        {
            string queryString = $"select top(1) c.{columnName} as Id from {tableName} as c order by NEWID()";
            return GetStringValueFromDatabase(queryString);
        }

        public static string GetRandomArtistId() { return GetRandomId("ArtistId", "[MusicandoTesting].dbo.Artists"); }
        public static string GetRandomAlbumId() { return GetRandomId("AlbumId", "[MusicandoTesting].dbo.Albums"); }
        public static string GetRandomSongId() { return GetRandomId("SongId", "[MusicandoTesting].dbo.Songs"); }
        public static string GetRandomPublicPlaylistId() { return GetRandomId("PublicPlaylistId", "[MusicandoTesting].dbo.PublicPlaylists"); }

        public static string GetRandomUserPlaylistId(string userName, string excludingPlaylistId = null)
        {
            string queryString = $"execute GetRandomUserPlaylistId '{userName}'" + (excludingPlaylistId != null ? $" , '{excludingPlaylistId}'" : "");
            return GetStringValueFromDatabase(queryString);
        }

        public static string GetRandomUserPlaylistIdNonEmpty(string userName, string excludingPlaylistId)
        {
            string queryString = $"execute GetRandomUserPlaylistIdNonEmpty '{userName}'" + (excludingPlaylistId != null ? $" , '{excludingPlaylistId}'" : "");
            return GetStringValueFromDatabase(queryString);
        }

        public static string GetRandomPlayableSongIdFromPlaylist(string playlistId)
        {
            string queryString = $"execute GetRandomPlayableSongIdFromPlaylist '{playlistId}'";
            return GetStringValueFromDatabase(queryString);
        }

        public static string GetRandomSongIdNotInPlaylist(string playlistId)
        {
            string queryString = $"execute GetRandomSongIdNotInPlaylist '{playlistId}'";
            return GetStringValueFromDatabase(queryString);
        }

        #endregion


        #region Playlists_and_PlayableSong

        public static bool CheckIfSongsExistInPlaylist(string[] songIds, int expectedCount, string playlistId)
        {
            string allSongIds = "'" + string.Join("','", songIds) + "'";
            string queryString = $"select Count(*) as Contagem from [MusicandoTesting].dbo.PlayableSongs as p "
                + "join [MusicandoTesting].dbo.Playables as y on p.PlayableId = y.PlayableId "
                + $"where p.SongId in ({allSongIds}) and y.PlaylistId = '{playlistId}';";
            int count = int.Parse(GetStringValueFromDatabase(queryString));

            return expectedCount == count;
        }

        public static bool CheckIfSongsAreAtTheEndOfPlaylist(string[] songIds, string playlistId)
        {
            string queryString = $"select top({songIds.Length}) p.SongId as SongId from [MusicandoTesting].dbo.PlayableSongs as p "
                + "join [MusicandoTesting].dbo.Playables as y on p.PlayableId = y.PlayableId " +
               $" where y.PlaylistId = '{playlistId}' order by p.Position desc";
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Connection.Open();
                var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    if (!songIds.Contains(reader["SongId"].ToString()))
                        return false;
                }
                return true;
            }
        }

        public static bool CheckIfPlaylistPositionsAreCorrect(string playlistId)
        {
            string queryString = $"select p.Position as Position from [MusicandoTesting].dbo.PlayableSongs as p "
                + "join [MusicandoTesting].dbo.Playables as y on p.PlayableId = y.PlayableId " +
            $" where y.PlaylistId = '{playlistId}' order by p.Position";
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Connection.Open();
                var reader = command.ExecuteReader();
                int expectedPosition = 0;
                while (reader.Read())
                {
                    if (reader["Position"].ToString() != expectedPosition.ToString())
                        return false;
                    expectedPosition++;
                }
                return true;
            }
        }

        public static int GetPlaylistCount(string playlistId)
        {
            string queryString = $"execute GetPlaylistCount '{playlistId}'";
            return int.Parse(GetStringValueFromDatabase(queryString));
        }

        #endregion


        #region PrivateSongs

        internal static string GetRandomUserPrivateSongId(string username)
        {
            string query = $"select top(1) p.PrivateSongId from [MusicandoTesting].dbo.PrivateSongs as p" +
                $" join [MusicandoTesting].dbo.AspNetUsers as u on p.MyUserId = u.Id " +
                $"where u.UserName = '{username}' order by NEWID(); ";
            return GetStringValueFromDatabase(query);
        }

        internal static bool CheckIfPrivateSongWasDeleted(string privateSongId)
        {

            //check that private song no longer exists in db:
            string query = $"select PrivateSongId from [MusicandoTesting].dbo.PrivateSongs where PrivateSongId = '{privateSongId}'";
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(query, connection);
                command.Connection.Open();
                var reader = command.ExecuteReader();
                if (reader.HasRows)
                    return false;
            }

            //check that it was removed from all playlists (no playablesongs with deleted private song):
            query = $"select ps.SongId from [MusicandoTesting].dbo.PlayableSongs as ps " +
                $"join [MusicandoTesting].dbo.Songs as s on ps.SongId = s.SongId " +
                $"where s.PrivateSongId = '{privateSongId}'";
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(query, connection);
                command.Connection.Open();
                var reader = command.ExecuteReader();
                return !reader.HasRows;
            }
        }

        internal static bool CheckIfPrivateSongWasCreated(Song expected, bool isEditedSong = false)
        {
            //check private song was created: Name, ArtistName, AlbumName
            if (!CompareResultWithDB<PrivateSong>($"execute GetPrivateSongInfo '{expected.PrivateSong.PrivateSongId}'", expected.PrivateSong))
                return false;
            
            //check if video was created: VideoUrl, StartAt, EndAt, Duration
            if (!CompareResultWithDB<Video>($"execute GetPrivateSongVideoInfo '{expected.PrivateSong.PrivateSongId}'", expected.Video))
                return false;
            
            //for new songs:
            //check if private song was added at the end of user's privateSong playlist:
            return isEditedSong || CompareResultWithDB<PrivateSong>($"execute GetPrivateSongPlaylistLastSong '{expected.PrivateSong.MyUser.UserName}'", expected.PrivateSong);
        }


        internal static bool CheckIfPrivateSongListMatchesDb(PrivateSongBasicVM[] expected, MyUser user)
        {
            Action<PrivateSongBasicVM[]> sortAction = a => a.OrderBy(i => i.PrivateSongId);

            return CompareResultsWithDB<PrivateSongBasicVM>(
                $"execute GetListOfPrivateSongBasicVM '{user.UserName}'", expected, sortAction);
        }

        internal static bool CheckIfPrivateSongBmMatchesDb( string requestPrivateSongId, PrivateSongBM responseObject)
        {
            return CompareResultWithDB<PrivateSongBM>($"execute GetPrivateSongBM '{requestPrivateSongId}'", responseObject);
        }

        internal static bool CheckIfPlayableSongVmForPrivateSongMatchesDb(PlayableSongVM responseObject, string requestPrivateSongId)
        {
            return CompareResultWithDB<PlayableSongVM>(
                $"execute GetPlayableSongVMForPrivateSongBM '{requestPrivateSongId}'", responseObject);
        }

        #endregion

    }
}
