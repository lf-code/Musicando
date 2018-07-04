

use [MusicandoTesting]
go



create or alter procedure GetPlayableVM @typeId as uniqueidentifier as
	select py.PlayableId, x.TypeId as TypeId, x.Name as Name, x.CreatorName as CreatorName from 
	(SELECT p.PlaylistId  as TypeId, Name, u.UserName as CreatorName  
	FROM [MusicandoTesting].dbo.Playlists as p join [MusicandoTesting].dbo.AspNetUsers as u on u.Id = p.MyUserId  
	UNION
	SELECT pp.PublicPlaylistId as TypeId, Name, 'Musicando' as CreatorName
	FROM [MusicandoTesting].dbo.PublicPlaylists as pp
	UNION
	SELECT al.AlbumId as TypeId, al.Name, ar.Name as CreatorName
	FROM [MusicandoTesting].dbo.Albums as al join [MusicandoTesting].dbo.Artists as ar on al.ArtistId = ar.ArtistId) as x
	join [MusicandoTesting].dbo.Playables as py on py.TypeId = x.TypeId
	where x.TypeId = @typeID
go

--execute GetPlayableVM 'f5ebd5a1-be44-499a-9888-c0bc0b809c06';


create or alter procedure GetListOfPlayableSongVM @PlayableId as uniqueidentifier as

	With SV(SongId, TypeId, VideoUrl, Duration, StartAt, EndAt, Position)
	As
	(
		select x.SongId, x.TypeId, v.VideoUrl, v.Duration, v.StartSec, v.EndSec, x.Position from
		(select s.SongId, s.TypeId, ps.Position from [MusicandoTesting].dbo.PlayableSongs as ps 
		join [MusicandoTesting].dbo.Songs as s 
		on s.SongId = ps.SongId where ps.PlayableId = @PlayableId ) as x
		left join [MusicandoTesting].dbo.Videos as v on v.SongId = x.SongId
	),
	PBL(TypeId, Name, AlbumName, ArtistName)
	As
	(
		Select p1.PublicSongId, p1.Name, al.Name, ar.Name from
		(Select r.PublicSongId, r.Name, r.AlbumId from [MusicandoTesting].dbo.PublicSongs  as r join SV on r.PublicSongId = TypeId) as p1 join
		[MusicandoTesting].dbo.Albums as al on al.AlbumId = p1.AlbumId join [MusicandoTesting].dbo.Artists as ar on al.ArtistId = ar.ArtistId
	),
	PRV(TypeId, Name, AlbumName, ArtistName)
	As
	(
		select  r.PrivateSongId, r.Name, r.AlbumName, r.ArtistName from [MusicandoTesting].dbo.PrivateSongs  as r join SV on r.PrivateSongId = TypeId
	)
	select  x.Name as Name, x.AlbumName as AlbumName, x.ArtistName as ArtistName,
	SV.Duration as Duration, SV.VideoUrl as VideoUrl, SV.StartAt as StartAt, SV.EndAt as EndAt, Position 
	from SV join (Select * from PRV Union Select * from PBL) as x on x.TypeId = SV.TypeId order by Position
go


--execute GetListOfPlayableSongVM 'B2B15CEF-597B-4E21-B91D-BBBB05477BB0';

--select PlayableId from [MusicandoTesting].dbo.Playables where PlaylistId = '3f403710-fc00-4226-8926-f642c491c094';



create or alter procedure GetListOfPlaylistBasicVM @USERNAME as nvarchar(256) as
	-- PlaylistId Name CreatorName
	select p.PlaylistId as PlaylistId, p.Name as Name, u.UserName as CreatorName 
	from AspNetUsers as u join Playlists as p on p.MyUserId = u.Id 
	where u.UserName = @USERNAME and p.PlaylistId != (select PlaylistId from PrivateSongPlaylists as y where y.MyUserId = u.Id)
	order by PlaylistId
go


create or alter procedure GetPlaylistBasicVM @USERNAME as nvarchar(256), @PLAYLISTID as uniqueidentifier as
	-- PlaylistId Name CreatorName
	select p.PlaylistId as PlaylistId, p.Name as Name, u.UserName as CreatorName from AspNetUsers as u join Playlists as p 
	on p.MyUserId = u.Id where u.UserName = @USERNAME and p.PlaylistId = @PLAYLISTID
go

--execute GetListOfPlaylistBasicVM 'Miguel'
--execute GetPlaylistBasicVM 'Miguel', 'CABD39E5-36CD-470D-A6E2-6F273EC91D77'

create or alter procedure GetRandomUserPlaylistId @USERNAME as nvarchar(256), @EXCLUDE_PLAYLISTID as uniqueidentifier = NULL as
	--EXCLUDE PLAYLIST OF PRIVATESONGS
	select Top(1) p.PlaylistId as PlaylistId 
	from AspNetUsers as u join Playlists as p on p.MyUserId = u.Id 
	where u.UserName = @USERNAME and (@EXCLUDE_PLAYLISTID is NULL or p.PlaylistId != @EXCLUDE_PLAYLISTID) 
	and p.PlaylistId != (select PlaylistId from PrivateSongPlaylists as h where h.MyUserId = u.Id)
	order by NEWID();
go

create or alter procedure GetRandomUserPlaylistIdNonEmpty @USERNAME as nvarchar(256), @EXCLUDE_PLAYLISTID as uniqueidentifier = NULL as
	with NonEmptyPlaylists(playlistId)
	as
	(
		select y.PlaylistId from (select PlayableId, COUNT(*) as contagem from PlayableSongs group by PlayableId) as c 
		join Playables as y on c.PlayableId = y.PlayableId where y.PlaylistId is not Null and c.contagem > 0
	)
	select Top(1) p.PlaylistId as PlaylistId from AspNetUsers as u join Playlists as p on p.MyUserId = u.Id join NonEmptyPlaylists as n on n.playlistId = p.PlaylistId
	where u.UserName = @USERNAME and (@EXCLUDE_PLAYLISTID is NULL or p.PlaylistId != @EXCLUDE_PLAYLISTID) 
	and p.PlaylistId != (select PlaylistId from PrivateSongPlaylists as h where h.MyUserId = u.Id)

	order by NEWID()
go

--execute GetRandomUserPlaylistIdNonEmpty 'Miguel'


create or alter procedure GetPlaylistCount @PLAYLISTID as uniqueidentifier as
	select c.contagem from (select PlayableId, COUNT(*) as contagem from PlayableSongs group by PlayableId) as c 
	join Playables as y on c.PlayableId = y.PlayableId where y.PlaylistId = @PLAYLISTID
go

--execute GetPlaylistCount 'CABD39E5-36CD-470D-A6E2-6F273EC91D77'

create or alter procedure GetRandomPlayableSongIdFromPlaylist @PLAYLISTID as uniqueidentifier as
	select top(1) ps.SongId from PlayableSongs as ps join Playables as y on y.PlayableId = ps.PlayableId where y.PlaylistId = @PLAYLISTID
	order by NEWID()
go

--execute GetRandomPlayableSongIdFromPlaylist 'CABD39E5-36CD-470D-A6E2-6F273EC91D77'


create or alter procedure GetRandomSongIdNotInPlaylist @PLAYLISTID as uniqueidentifier as

	select top(1) s.SongId from Songs as s where s.SongId not in 
	(select ps.SongId from PlayableSongs as ps join Playables as y on y.PlayableId = ps.PlayableId where y.PlaylistId = @PLAYLISTID)
	order by NEWID()

go


-- PRIVATESONGS:

create or alter procedure GetPrivateSongInfo @PrivateSongId as uniqueidentifier as
	select Name, AlbumName, ArtistName from PrivateSongs where PrivateSongId = @PrivateSongId;
go

create or alter procedure GetPrivateSongVideoInfo @PrivateSongId as uniqueidentifier as
	select v.VideoUrl, v.StartSec, v.EndSec, v.Duration from Videos as v 
	join Songs as s on s.SongId = v.SongId where s.PrivateSongId = @PrivateSongId
go

create or alter procedure GetPrivateSongPlaylistLastSong @USERNAME as nvarchar(256) as
	select top(1) s.PrivateSongId from PlayableSongs as ps
	join Songs as s on s.SongId = ps.SongId
	join Playables as y on y.PlayableId = ps.PlayableId 
	join PrivateSongPlaylists as x on x.PlaylistId = y.PlaylistId
	join AspNetUsers as u on u.Id = x.MyUserId 
	where u.UserName = @USERNAME order by Position desc
go

use [MusicandoTesting]
go
create or alter procedure GetListOfPrivateSongBasicVM @USERNAME as nvarchar(256) as
	select s.SongId as SongId, ps.PrivateSongId as PrivateSongId, ps.Name as Name
	from AspNetUsers as u join PrivateSongs as ps on ps.MyUserId = u.Id 
	join Songs as s on s.PrivateSongId = ps.PrivateSongId
	where u.UserName = @USERNAME
	order by PrivateSongId
go

--execute GetListOfPrivateSongBasicVM 'Miguel'

use [MusicandoTesting]
go
create or alter procedure GetPrivateSongBM @PrivateSongId as nvarchar(256) as
	select ps.Name as Name, ps.ArtistName as ArtistName, ps.AlbumName as AlbumName,
	v.VideoUrl as VideoUrl,
	TIMEFROMPARTS ( (v.StartSec/(60*60)), (v.StartSec/(60)), (v.StartSec%60), 0, 0 ) AS StartAt,
	TIMEFROMPARTS ( (v.EndSec/(60*60)), (v.EndSec/(60)), (v.EndSec%60), 0, 0 ) AS EndAt
	from PrivateSongs as ps join Songs as s on s.PrivateSongId = ps.PrivateSongId
	join Videos as v on v.SongId = s.SongId 
	where ps.PrivateSongId = @PrivateSongId
go

--exec GetPrivateSongBM '0C260C31-F719-42FD-A563-7193A3CF604D'

use [MusicandoTesting]
go
create or alter procedure GetPlayableSongVMForPrivateSongBM @PrivateSongId as nvarchar(256) as	
		select 'True' as IsPrivate, s.SongId, v.VideoUrl, v.Duration, v.StartSec, v.EndSec, -1 as Position,
		ps.Name, ps.AlbumName, ps.ArtistName, NULL as AlbumImgLink from
		PlayableSongs as pls join Songs as s on s.SongId = pls.SongId
		join Videos as v on v.SongId = s.SongId
		join PrivateSongs as ps on s.PrivateSongId = ps.PrivateSongId
		where ps.PrivateSongId = @PrivateSongId
go

exec GetPlayableSongVMForPrivateSongBM '9d152cea-bafe-4507-bc2a-bb2e8ef2e3c4'

--use [MusicandoTesting]
--go
--exec GetPrivateSongPlaylistLastSong 'Miguel'

--			public string SongId { get; set; } s

--        public bool IsPrivate {get;set;} x

--        public string Name { get; set; } x
--        public string ArtistName { get; set; } x
--        public string AlbumName { get; set; } x
--        public string AlbumImgLink { get; set; }

--        public string VideoUrl { get; set; } x
--        public string Duration { get; set; } x
--        public string StartAt { get; set; } x
--        public string EndAt { get; set; } x

--        public int Position { get; set; } x

