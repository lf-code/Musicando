import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlaylistBasicVM, PlayableSongVM, PlayableVM } from "app/models/api-view-models";
import { PlayableSongBM } from "app/models/api-binding-models";


@Injectable()
export class ApiPlayableService {

  //This service uses angular's http service to interact with api's to retrieve and edit playables
  //Each method returns an Observable<Object> to be subscribed by the caller so he can handle api's response.

  constructor(private http: HttpClient) { }

  HTTP_OPTIONS = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), withCredentials: true };

  public getPlaylist(playlistId: string) {
    return this.http.get<PlayableVM>("/api/playable/playlist/" + playlistId, this.HTTP_OPTIONS);
  }

  public getPublicPlaylist(publicPlaylistId: string) {
    return this.http.get<PlayableVM>("/api/playable/publicplaylist/" + publicPlaylistId, this.HTTP_OPTIONS);
  }

  public getAlbum(albumId: string) {
    return this.http.get<PlayableVM>("/api/playable/album/" + albumId, this.HTTP_OPTIONS);
  }

  public getDefaultPlaylist() {
    return this.http.get<PlayableVM>("/api/playlist/default");
  }

  public addSongsToPlaylist(songIds: string[], playlistId: string) {
    return this.http.post("/api/playlist/" + playlistId + "/adicionarcancoes", JSON.stringify(songIds), this.HTTP_OPTIONS);
  }

  public removeSongFromPlaylist(songId: string, playlistId: string) {
    return this.http.post("/api/playlist/" + playlistId + "/remover/" + songId, {}, this.HTTP_OPTIONS);
  }

  public changePositionInPlaylist(songId: string, playlistId: string, newPosition: number) {
    let bm = new PlayableSongBM();
    bm.songId = songId;
    bm.position = newPosition;
    return this.http.post("/api/playlist/" + playlistId + "/mudarposicao", JSON.stringify(bm), this.HTTP_OPTIONS);
  }

}
