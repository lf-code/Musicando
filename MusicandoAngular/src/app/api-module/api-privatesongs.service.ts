import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PrivateSongBasicVM, PlayableSongVM, PlaylistBasicVM } from 'app/models/api-view-models';
import { PrivateSongBM } from "app/models/api-binding-models";


@Injectable()
export class ApiPrivatesongsService {

  //This service uses angular's http service to interact with api's for private songs CRUD operations 
  //Each method returns an Observable<Object> to be subscribed by the caller so he can handle api's response.

  constructor(private http: HttpClient) { }

  HTTP_OPTIONS = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), withCredentials: true };

  public getAll() {
    return this.http.get<PrivateSongBasicVM[]>("/api/musicasprivadas", this.HTTP_OPTIONS);
  }

  public getPlayableSong(privateSongId: string) {
    return this.http.get<PlayableSongVM>("/api/musica/privada/" + privateSongId, this.HTTP_OPTIONS);
  }

  public getInfo(privateSongId: string) {
    return this.http.get<PrivateSongBM>("/api/musicasprivadas/info/" + privateSongId, this.HTTP_OPTIONS);
  }

  public getPlaylist() {
    return this.http.get<PlaylistBasicVM>("/api/playlists/musicasprivadas", this.HTTP_OPTIONS);
  }

  public create(privateSongBM: PrivateSongBM) {
    return this.http.post<PrivateSongBasicVM>("/api/musicasprivadas/criar", JSON.stringify(privateSongBM), this.HTTP_OPTIONS);
  }

  public delete(privateSongId: string) {
    return this.http.post<string>("/api/musicasprivadas/apagar/" + privateSongId, null, this.HTTP_OPTIONS);
  }

  public edit(privateSongId: string, privateSongBM: PrivateSongBM) {
    return this.http.post<PrivateSongBasicVM>("/api/musicasprivadas/editar/" + privateSongId, JSON.stringify(privateSongBM), this.HTTP_OPTIONS);
  }

}
