import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiAccountService } from "app/api-module/api-account.service";
import { LoginBM } from 'app/models/api-binding-models';
import { SongOptionsContext } from 'app/models/internal-models';
import { UserBasicVM } from 'app/models/api-view-models';
import { tap } from 'rxjs/operators';


@Injectable()
export class UserService {

  constructor(private apiAccountService: ApiAccountService) {

    //Subscribes to its own Login/Logout Observables to set
    // 'isPlayableSongOptionsAvailable' accordingly
    //(extracted from login/logout methods)
    this.onUserAuthenticated$.subscribe(data => { this.isPlayableSongOptionsAvailable = true; });
    this.onUserLogout$.subscribe(data => { this.isPlayableSongOptionsAvailable = false; });
  }

  // ----- AUTHENTICATION -----

  //Observable: informs subscribers that an user has been authenticated
  _onUserAuthenticated = new Subject<UserBasicVM>();
  onUserAuthenticated$ = this._onUserAuthenticated.asObservable();

  //Observable: informs subscribers that the authenticated user has logged out
  _onUserLogout = new Subject();
  onUserLogout$ = this._onUserLogout.asObservable();

  /**
   * Asks ApiAccountService to try and authenticate an user.
   * It returns a promise to its caller, but also taps the response
   * so that if login is successfull, it emits the respective info
   * to inform interested components and services.
   * @param logindata Login data containing login credentials
   */
  login(logindata: LoginBM) {

    return this.apiAccountService.login(logindata)
      .pipe(tap((data: UserBasicVM) => this._onUserAuthenticated.next(data)))
      .toPromise();
  }

  /**
   * Asks ApiAccountService to log out the authenticathed user.
   * If successfull, emits the respective info to subscribers of 'OnUserLogout'.
   */
  logout() {
    this.apiAccountService.logout().subscribe(
      data => { this._onUserLogout.next() }
    );
  }


  // ----- SONG OPTIONS -----

  //Informs other services and components if it is possible to
  //access options for a given song.
  public isPlayableSongOptionsAvailable = false;

  //Observable: informs the AuthUser components and subcomponents that
  //they should display the menu with the options for a given song context.
  _onShowPlayablesongOptions = new Subject<SongOptionsContext>();
  onShowPlayablesongOptions$ = this._onShowPlayablesongOptions.asObservable();

  /**
   * Allows other services and components to summon the menu with the options
   * for a given song and playlist.
   * @param songOptionsContext Info about the song and playlist for which options
   * should be displayed.
   */
  public showPlayablesongOptions(songOptionsContext: SongOptionsContext) {
    this._onShowPlayablesongOptions.next(songOptionsContext);
  }


  // ----- REGEX PATTERNS -----

  MY_REGEX =
    {
      email: "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?",
      username: "[A-Za-z0-9_]{6,20}",
      password: "[A-Za-z0-9\._\%\+\!\?\@\#\$\&\-]{8,24}"
    }

  PLAYLIST_NAME_PATTERN: string = "[A-Za-z\u00C0-\u00FC]{1}[A-Za-z0-9_\u00C0-\u00FC \(\)!?#&]{0,29}";

}
