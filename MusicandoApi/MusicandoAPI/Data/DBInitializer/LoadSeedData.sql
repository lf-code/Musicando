--Create 'MusicandoSeedData' manually;

use MusicandoSeedData
go

--create tables, if they do not exist yet:

IF object_id('PublicSongs', 'U') is null
Begin
create table MusicandoSeedData.dbo.PublicSongs
(
	ArtistId nvarchar(255) Not null,
	ArtistName nvarchar(255) Not null,
	AlbumId nvarchar(255) Not null,
	AlbumName nvarchar(255) Not null,
	AlbumImgLink nvarchar(255) Not null,
	SongId nvarchar(50) Not null PRIMARY KEY,
	PublicSongId nvarchar(50) Not null,
	SongName nvarchar(255) Not null,
	PositionInAlbum nvarchar(255) Not null,
	VideoId nvarchar(255) null,
	VideoUrl nvarchar(255) null,
	StartAt nvarchar(255) null,
	EndAt nvarchar(255) null,
	Duration nvarchar(255) null,
	IsLive nvarchar(255) null,
	IsHit nvarchar(255) not null
)
end


IF object_id('Playlists', 'U') is null
Begin
create table MusicandoSeedData.dbo.Playlists
(
	PlaylistId nvarchar(50) Not null,
	PlaylistName nvarchar(255) Not null,
	CreatorName nvarchar(255) Not null,
	SongId nvarchar(50) Not null ,
	Position nvarchar(255) Not null,	
	IsPublic nvarchar(255) Not null,	
	PlaylistDescription nvarchar(255) null

	CONSTRAINT [PK_Playlist] PRIMARY KEY CLUSTERED 
	(
		[SongId] ASC,
		[PlaylistId] ASC
	)
)
end

IF object_id('PrivateSongs', 'U') is null
Begin
	create table MusicandoSeedData.dbo.PrivateSongs
	(
		SongId nvarchar(50) Not null PRIMARY KEY,	
		PrivateSongId nvarchar(50) Not null,	 
		Username nvarchar(255) Not null,	
		Name nvarchar(255) Not null,	
		ArtistName nvarchar(255) Not null,	
		AlbumName nvarchar(255) null,	
		VideoUrl nvarchar(255) Not null,
		StartAt nvarchar(255) Not null,	
		EndAt nvarchar(255) Not null,	
		Duration nvarchar(255) Not null
	)
end

IF object_id('Users', 'U') is null
Begin
create table MusicandoSeedData.dbo.Users
(
	UserName nvarchar(255) Not null PRIMARY KEY
)
end

--Load data form excel file:

EXEC sp_configure 'show advanced options', 1
RECONFIGURE
GO
EXEC sp_configure 'ad hoc distributed queries', 1
RECONFIGURE
GO

create or alter procedure LoadSeedDataFromExcel @excelFileFullPath as varchar(max) as
	
	Declare @sql nvarchar(max);
	
	--PublicSongs:
	delete from MusicandoSeedData.dbo.PublicSongs;
	Set @sql='insert into MusicandoSeedData.dbo.PublicSongs 
	select * FROM OPENROWSET(
	''Microsoft.ACE.OLEDB.12.0'',
	''Excel 12.0 Xml;HDR=YES;Database='+ @excelFileFullPath +''',
	''SELECT * FROM [PublicSongs$]'')'
	Exec(@sql)

	--PrivateSongs:
	delete from MusicandoSeedData.dbo.PrivateSongs;
	Set @sql='insert into MusicandoSeedData.dbo.PrivateSongs
	select * FROM OPENROWSET(
	''Microsoft.ACE.OLEDB.12.0'',
	''Excel 12.0 Xml;HDR=YES;Database='+ @excelFileFullPath +''',
	''SELECT * FROM [PrivateSongs$]'')'
	Exec(@sql)

	--Playlists:
	delete from MusicandoSeedData.dbo.Playlists;
	Set @sql='insert into MusicandoSeedData.dbo.Playlists
	select * FROM OPENROWSET(
	''Microsoft.ACE.OLEDB.12.0'',
	''Excel 12.0 Xml;HDR=YES;Database='+ @excelFileFullPath +''',
	''SELECT * FROM [Playlists$]'')'
	Exec(@sql)

	--Users:
	delete from MusicandoSeedData.dbo.Users;
	Set @sql='insert into MusicandoSeedData.dbo.Users
	select * FROM OPENROWSET(
	''Microsoft.ACE.OLEDB.12.0'',
	''Excel 12.0 Xml;HDR=YES;Database='+ @excelFileFullPath +''',
	''SELECT UserName FROM [Users$]'')'
	Exec(@sql)
go

