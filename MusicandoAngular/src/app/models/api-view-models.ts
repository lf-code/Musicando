//View Model from API with basic info about a playlist
export class PlaylistBasicVM {
  playlistId: string;
  name: string;
}

//View Model from API with playble info
export class PlayableVM {
  typeId: string;
  playableId: string;
  name: string;
  creatorName: string;
  type: string;
  playableSongs: PlayableSongVM[];
}

//View Model from API with basic info about a song
export class SongBasicVM {
  songId: string = null;
  name: string = null;
  artistName: string = null;
  albumName: string = null;
  isPrivate: boolean = false;
}

//View Model from API with playable info for a song
export class PlayableSongVM extends SongBasicVM {
  albumImgLink: string;
  videoUrl: string;
  startSec: number;
  endSec: number;
  duration: string;
  position: number;
}

//View Model from API with basic info about an artist
export class ArtistBasicVM {
  artistId: string;
  name: string;
  hitsPlaylistId: string;
  albums: AlbumBasicVM[];
}

//View Model from API with basic info about an album
export class AlbumBasicVM {
  albumId: string;
  name: string;
  imgLink: string;

  //load only as needed 
  tracks: AlbumTrackVM[];
}

//View Model from API with info about a track in an album
export class AlbumTrackVM {
  songId: string;
  name: string;
  duration: string;
  position: number;
}

//View Model from API with basic info about a public playlist
export class PublicPlaylistBasicVM {
  publicPlaylistId: string;
  name: string;
  playlistDescription: string;
  imgLinks: string[];
}

//View Model from API with info about errors that occurred
//in server when trying to register a new user
export class RegisterErrorVM {
  public invalidEmail: boolean;
  public invalidUsername: boolean;
  public invalidPassword: boolean;
  public invalidConfirmPassword: boolean;
  public existingEmail: boolean;
  public existingUsername: boolean;
  public passwordsDoNotMatch: boolean;
}

//View Model from API with basic info about a user's private song
export class PrivateSongBasicVM {
  public privateSongId: string;
  public songId: string;
  public name: string;
}

//View Model from API with a given search result
export class SearchResultVM {

  public type: string; // ARTIST | ALBUM | SONG
  public name: string;
  public artistId: string;
  public albumId: string;
  public songId: string;
}

//View Model from API with the basic info about an user
export class UserBasicVM {
  username: string;
}
