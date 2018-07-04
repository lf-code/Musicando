import { Injectable, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SongOptionsContext } from '../models/internal-models';
import {
  SearchResultVM, ArtistBasicVM, PublicPlaylistBasicVM,
  AlbumTrackVM, PlayableSongVM
} from 'app/models/api-view-models';

@Injectable()
export class ApiBrowseService {

  //This service uses angular's http service to interact with api's browse controller
  //Each method returns an Observable<Object> to be subscribed by the caller so he can handle api's response.

  constructor(private http: HttpClient) { }

  getArtists() {
    return this.http.get<ArtistBasicVM[]>("/api/browse/artistas");
  }

  getPlaylists() {
    return this.http.get<PublicPlaylistBasicVM[]>("/api/browse/playlists");
  }

  getAlbumTracks(albumId: string) {
    return this.http.get<AlbumTrackVM[]>("/api/browse/album/" + albumId);
  }

  getAlbumSong(songId: string) {
    return this.http.get<PlayableSongVM>("/api/musica/publica/" + songId)
  }

  search(searchText: string, searchType: string) {
    let options = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    let aux = { "artist": "artista", "album": "album", "song": "cancao" }
    let type = aux[searchType];
    return this.http.post<SearchResultVM[]>("/api/browse/procurar/" + type, JSON.stringify(searchText), options);
  }


}
