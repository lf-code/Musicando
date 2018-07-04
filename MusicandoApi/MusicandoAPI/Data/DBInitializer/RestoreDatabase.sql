
-- !!!RUN TWICE!!!
-- 1) REPLACE ALL 'MusicandoTesting' for 'MusicandoDevelopment', RUN!
-- 2) REPLACE ALL 'MusicandoDevelopment' for 'MusicandoTesting', RUN!

-- 'MusicandoDevelopment' for Development Env
-- 'MusicandoTesting' for Testing Env

-- Only selection; do not select comments.

Use MusicandoSeedData
go

CREATE OR ALTER PROCEDURE ClearDB_MusicandoTesting as

	-- First delete all dependent tables that do not cascade (by design choice, to avoid cycles):
	delete from [MusicandoTesting].dbo.PlayableSongs;
	delete from [MusicandoTesting].dbo.PrivateSongPlaylists;

	-- Delete all non-user tables:
	DECLARE @NAME VARCHAR(100)
	DECLARE @SQL NVARCHAR(300)

	DECLARE CUR CURSOR FOR
	  SELECT NAME
	  FROM [MusicandoTesting].SYS.TABLES
	OPEN CUR

	FETCH NEXT FROM CUR INTO @NAME

	WHILE @@FETCH_STATUS = 0
	  BEGIN
		  IF not(Left(@NAME,3) = 'Asp' or Left(@NAME,2) = '__')
			BEGIN
			  EXECUTE('delete FROM [MusicandoTesting].dbo.'+@NAME+'')
			END
		  FETCH NEXT FROM CUR INTO @NAME
	  END

	CLOSE CUR
	DEALLOCATE CUR 

	-- Delete all but valid users:
	DELETE FROM [MusicandoTesting].dbo.AspNetUsers 
	WHERE UserName Not in (Select UserName from MusicandoSeedData.dbo.Users);

GO


create or alter procedure LoadData_MusicandoTesting as
	begin

		-- Check if there are users in DB (if not, seed users from app)
		begin
			declare @contagem as int;
			set @contagem = (select COUNT(*) from [MusicandoTesting].dbo.AspNetUsers);
			if @contagem = 0
			begin 
				print 'Error! No Users!'
				return 0;  
			end
		end

		Print '----- LOAD DATA -----'

		-- 1) ARTISTS:

		--create a temp table that links: artist <- hits public playlist -> playable for such public playlist
		DECLARE @AuxTableArtist table(ArtistId uniqueidentifier NOT NULL, 
			PublicPlaylistId uniqueidentifier NOT NULL, PlayableId uniqueidentifier NOT NULL)	
		insert into @AuxTableArtist(ArtistId, PublicPlaylistId, PlayableId) 
		select a.artistId, NEWID(), NEWID() 
		from (select distinct ArtistId from MusicandoSeedData.dbo.PublicSongs) as a;
	
		--create public playlists, and then the playables, defined in @AuxTableArtist
		insert into [MusicandoTesting].dbo.PublicPlaylists(PublicPlaylistId,ShowInBrowse) 	
		select a.PublicPlaylistId, 0 from @AuxTableArtist as a
		insert into [MusicandoTesting].dbo.Playables(PlayableId, PublicPlaylistId) 
		select a.PlayableId, a.PublicPlaylistId from @AuxTableArtist as a;

		--create artists
		insert into [MusicandoTesting].dbo.Artists( ArtistId, Name, PublicPlaylistId)
		select a.ArtistId, a.ArtistName, x.PublicPlaylistId 
		from (select distinct ArtistId, ArtistName 
		from MusicandoSeedData.dbo.PublicSongs) as a 
		join @AuxTableArtist as x on a.ArtistId = x.ArtistId;

		-- 2) ALBUMS:

		--create table that links album to its playable:
		DECLARE @AuxTableAlbum table(AlbumId uniqueidentifier NOT NULL, 
			PlayableId uniqueidentifier NOT NULL)
		insert into @AuxTableAlbum(AlbumId, PlayableId) select a.AlbumId, NEWID()  
		from (select distinct AlbumId, AlbumName, AlbumImgLink, ArtistId 
		from MusicandoSeedData.dbo.PublicSongs) as a;

		--create albums:
		insert into [MusicandoTesting].dbo.Albums( AlbumId, Name, ImgLink, ArtistId)
		select distinct a.AlbumId, a.AlbumName, a.AlbumImgLink, a.ArtistId from 
		(select distinct AlbumId, AlbumName, AlbumImgLink, ArtistId 
		from MusicandoSeedData.dbo.PublicSongs) as a;

		--create corresponding playable:
		insert into [MusicandoTesting].dbo.Playables(PlayableId, AlbumId) select a.PlayableId, AlbumId 
		from @AuxTableAlbum as a;
	
		-- 3) PUBLIC SONGS:

		-- create public songs:
		insert into [MusicandoTesting].dbo.PublicSongs(PublicSongId, Name, AlbumId)
		select distinct s.PublicSongId, s.SongName, s.AlbumId from 
		(select distinct PublicSongId, SongName, AlbumId 
		from MusicandoSeedData.dbo.PublicSongs) as s;

		--create corresponding songs:
		insert into [MusicandoTesting].dbo.Songs( SongId, PublicSongId)
		select distinct s.SongId, s.PublicSongId from 
		(select distinct SongId, PublicSongId from MusicandoSeedData.dbo.PublicSongs) as s;

		-- 4) VIDEOS:
		insert into [MusicandoTesting].dbo.Videos( VideoId, VideoUrl, StartSec, EndSec, Duration, SongId, IsLive)
		select distinct d.VideoId, d.VideoUrl, d.StartAt, d.EndAt, d.Duration, d.SongId, d.IsLive 
		from MusicandoSeedData.dbo.PublicSongs as d
		where d.VideoId is not null;

		-- 5) PRIVATE SONGS:

		--create private songs:
		insert into [MusicandoTesting].dbo.PrivateSongs( PrivateSongId, Name, ArtistName, AlbumName, MyUserId)
		select d.PrivateSongId, d.Name, d.ArtistName, d.AlbumName, u.Id 
		from MusicandoSeedData.dbo.PrivateSongs as d
		join [MusicandoTesting].dbo.AspNetUsers as u on u.UserName = d.Username;
	
		--create corresponding songs:
		insert into [MusicandoTesting].dbo.Songs(SongId, PrivateSongId)
		select d.SongId, d.PrivateSongId from MusicandoSeedData.dbo.PrivateSongs as d;
	
		--create corresponding videos:
		insert into [MusicandoTesting].dbo.Videos(SongId, VideoId, VideoUrl, StartSec, EndSec, Duration, IsLive)
		select d.SongId, NEWID(), d.VideoUrl, d.StartAt, d.EndAt, d.Duration, 'False' 
		from MusicandoSeedData.dbo.PrivateSongs as d;

	end
go


CREATE OR ALTER PROCEDURE LoadArtistsHitsPlaylists_MusicandoTesting AS
	BEGIN 	 

		-- update name and description
		update p set p.PlaylistDescription = 'As melhores canções de '+a.Name, p.Name = 'Êxitos de '+a.Name
		from [MusicandoTesting].dbo.PublicPlaylists as p join [MusicandoTesting].dbo.Artists as a on p.PublicPlaylistId = a.PublicPlaylistId;  
	 
		-- add hit playablesongs:
		Insert Into [MusicandoTesting].dbo.PlayableSongs(SongId, PlayableId, Position)
		select d.SongId, py.PlayableId, 0 from MusicandoSeedData.dbo.PublicSongs as d 
		join [MusicandoTesting].dbo.Artists as a on a.ArtistId = d.ArtistId 
		join [MusicandoTesting].dbo.PublicPlaylists as pp on pp.PublicPlaylistId = a.PublicPlaylistId
		join [MusicandoTesting].dbo.Playables as py on py.PublicPlaylistId = pp.PublicPlaylistId
		where d.IsHit = '1';

		-- update positions:
		update w set w.Position = w.Rank - 1
		from (select ps.PlayableId, ps.SongId, ps.Position, DENSE_RANK() 
		OVER (PARTITION BY ps.PlayableId ORDER BY ps.SongId DESC) AS Rank
		from [MusicandoTesting].dbo.PlayableSongs as ps join [MusicandoTesting].dbo.Playables as y 
		on ps.PlayableId = y.PlayableId
		join [MusicandoTesting].dbo.Artists as a on a.PublicPlaylistId = y.PublicPlaylistId) as w;

	END
GO


CREATE OR ALTER PROCEDURE LoadPrivateSongPlaylists_MusicandoTesting AS
	BEGIN 

		declare @PName as nvarchar(max) = 'Músicas Privadas'

		--create playlist
		insert into [MusicandoTesting].dbo.Playlists(PlaylistId, Name, MyUserId) 
		select NEWID(), @PName, u.Id from [MusicandoTesting].dbo.AspNetUsers as u;
 
		--create privatesongplaylist
		insert into [MusicandoTesting].dbo.PrivateSongPlaylists(PlaylistId, MyUserId) 
		select p.PlaylistId, p.MyUserId from [MusicandoTesting].dbo.Playlists as p
		where p.Name = @PName;

		--create corresponding playable
		insert into [MusicandoTesting].dbo.Playables(PlayableId, PlaylistId)
		select newId(), p.PlaylistId from [MusicandoTesting].dbo.Playlists as p
		where p.Name = @PName;

		--add playable songs
		-- with playables corresponding to privatesong playlists
		with PL(PlayableId, MyUserId) as 
		(
			select y.PlayableId, MyUserId from [MusicandoTesting].dbo.Playlists as p
			join [MusicandoTesting].dbo.Playables as y on p.PlaylistId = y.PlaylistId
			where p.Name = @PName
		)
		insert into [MusicandoTesting].dbo.PlayableSongs(SongId, PlayableId, Position)
		select s.SongId, pl.PlayableId, 1 
		from [MusicandoTesting].dbo.PrivateSongs as pvs 
		join [MusicandoTesting].dbo.Songs as s on s.PrivateSongId = pvs.PrivateSongId
		join PL as pl on pl.MyUserId = pvs.MyUserId;

		--update positions in privatesongs playlist
		update z set z.Position = z.Rank - 1
		from (select ps.PlayableId, ps.SongId, ps.Position, DENSE_RANK() 
		OVER (PARTITION BY ps.PlayableId ORDER BY ps.SongId DESC) AS Rank 
		from [MusicandoTesting].dbo.PlayableSongs as ps 
		join [MusicandoTesting].dbo.Playables as y on y.PlayableId = ps.PlayableId 
		join [MusicandoTesting].dbo.Playlists as x on x.PlaylistId = y.PlaylistId
		join [MusicandoTesting].dbo.PrivateSongPlaylists as t on t.PlaylistId = x.PlaylistId) as z;

	END
GO


CREATE OR ALTER PROCEDURE LoadPlayables_MusicandoTesting AS
	BEGIN 
		-- 1) ALBUMS:

		--add playablesongs: (get Position from TestData) 	
		insert into [MusicandoTesting].dbo.PlayableSongs(PlayableId, SongId, Position)
		select p.PlayableId, d.SongId, d.PositionInAlbum 
		from MusicandoSeedData.dbo.PublicSongs as d
		join [MusicandoTesting].dbo.Playables as p on d.AlbumId = p.AlbumId

	END

	BEGIN 
		-- 2) USER PLAYLISTS:

		--create  temp table that links playables to playlists:
		DECLARE @PlaylistPlayables table(PlayableId uniqueidentifier NOT NULL, PlaylistId uniqueidentifier NOT NULL)
		insert into @PlaylistPlayables(PlayableId,PlaylistId) 
		select newId(), x.PlaylistId from (select distinct d.PlaylistId	
		from MusicandoSeedData.dbo.Playlists as d where d.IsPublic = 'False') as x

		--create playlists:
		insert into [MusicandoTesting].dbo.Playlists(PlaylistId, MyUserId, Name) 
		select x.PlaylistId, x.Id, x.PlaylistName from 
		(select distinct d.PlaylistId, u.Id, d.PlaylistName 
		from MusicandoSeedData.dbo.Playlists as d join [MusicandoTesting].dbo.AspNetUsers as u
		 on d.CreatorName = u.UserName and d.IsPublic = 'False') as x 

		--create corresponding playables
		insert into [MusicandoTesting].dbo.Playables(PlayableId, PlaylistId) select PlayableId, PlaylistId from @PlaylistPlayables;
	
		--add playablesongs: (get Positions from TestData)	
		insert into [MusicandoTesting].dbo.PlayableSongs(PlayableId, SongId, Position)
		select p.PlayableId, d.SongId, d.Position from MusicandoSeedData.dbo.Playlists as d join 
		[MusicandoTesting].dbo.Playables as p on d.PlaylistId = p.PlaylistId;
	END

	BEGIN
		-- 3) PUBLICPLAYLISTS:

		--create  temp table that links playables to playlists:
		DECLARE @PublicPlaylistPlayables table(PlayableId uniqueidentifier NOT NULL, 
			PublicPlaylistId uniqueidentifier NOT NULL)
		insert into @PublicPlaylistPlayables(PlayableId,PublicPlaylistId) select newId(), x.PlaylistId 
		from (select distinct d.PlaylistId from MusicandoSeedData.dbo.Playlists as d 
		where d.IsPublic = 'True' and d.Position = 0) as x

 		--create public playlists:
		insert into [MusicandoTesting].dbo.PublicPlaylists(PublicPlaylistId,Name, PlaylistDescription, ShowInBrowse)
		select distinct d.PlaylistId, d.PlaylistName, d.PlaylistDescription, 1 
		from MusicandoSeedData.dbo.Playlists as d where d.IsPublic = 'True' and d.Position = 0

		-- create playable:
		insert into [MusicandoTesting].dbo.Playables(PlayableId, PublicPlaylistId) 
		select PlayableId, PublicPlaylistId from @PublicPlaylistPlayables;

		--add playablesongs: (get position from TestData)
		insert into [MusicandoTesting].dbo.PlayableSongs(PlayableId, SongId, Position)
		select p.PlayableId, d.SongId, d.Position from MusicandoSeedData.dbo.Playlists as d 
		join [MusicandoTesting].dbo.Playables as p on d.PlaylistId = p.PublicPlaylistId;
	END
GO

CREATE OR ALTER PROCEDURE RestoreDatabase_MusicandoTesting as

	-- Clear Database:
	exec ClearDB_MusicandoTesting;

	-- Load basic data:
	exec LoadData_MusicandoTesting;

	-- Add songs to hits playlists
	exec LoadArtistsHitsPlaylists_MusicandoTesting;

	-- Create private song playlists for each user:
	exec LoadPrivateSongPlaylists_MusicandoTesting;

	-- Add song to playables:
	exec LoadPlayables_MusicandoTesting;
GO

--exec MusicandoSeedData.dbo.RestoreDatabase_MusicandoTesting;
