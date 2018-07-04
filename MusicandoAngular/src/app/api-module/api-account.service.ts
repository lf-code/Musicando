import { Injectable } from '@angular/core';
import { LoginBM, RegisterBM, ChangePasswordBM } from 'app/models/api-binding-models';
import { UserBasicVM } from 'app/models/api-view-models';

import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable()
export class ApiAccountService {

  //This service uses angular's http service to interact with api's user controller
  //Each method returns an Observable<Object> to be subscribed by the caller so he can handle api's response.

  constructor(private http: HttpClient) { }

  HTTP_OPTIONS = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), withCredentials: true };

  public login(loginData: LoginBM) {
    return this.http.post<UserBasicVM>("/api/user/login", JSON.stringify(loginData), this.HTTP_OPTIONS);
  }

  public register(registerData: RegisterBM) {
    return this.http.post<UserBasicVM>("/api/user/registar", JSON.stringify(registerData), this.HTTP_OPTIONS);
  }

  public changePassword(data: ChangePasswordBM) {
    return this.http.post("/api/user/mudarpassword", JSON.stringify(data), this.HTTP_OPTIONS);
  }

  public deleteAccount(data: LoginBM) {
    return this.http.post("/api/user/apagarconta", JSON.stringify(data), this.HTTP_OPTIONS);
  }

  public logout() {
    return this.http.post("/api/user/logout", '', this.HTTP_OPTIONS);
  }

}
