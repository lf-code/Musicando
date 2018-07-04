import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlaylistBasicVM, PlayableVM } from "app/models/api-view-models";

@Injectable()
export class ApiPlaylistsService {

  //This service uses angular's http service to interact with api's for user playlists CRUD operations 
  //Each method returns an Observable<Object> to be subscribed by the caller so he can handle api's response.

  constructor(private http: HttpClient) { }

  HTTP_OPTIONS = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), withCredentials: true };

  public getAll() {
    return this.http.get<PlaylistBasicVM[]>("/api/playlists", this.HTTP_OPTIONS);
  }

  public newPlaylist(playlistName: string) {
    let data = { playlistName: playlistName };
    return this.http.post<PlaylistBasicVM>("/api/playlists/criar", JSON.stringify(data), this.HTTP_OPTIONS);
  }

  public deletePlaylist(playlistId: string) {
    return this.http.post<PlaylistBasicVM>("/api/playlists/apagar/" + playlistId, {}, this.HTTP_OPTIONS);
  }

  public editPlaylist(playlistId: string, newName: string) {
    let data = { playlistName: newName };
    return this.http.post<PlaylistBasicVM>("/api/playlists/editar/" + playlistId, JSON.stringify(data), this.HTTP_OPTIONS);
  }

}
