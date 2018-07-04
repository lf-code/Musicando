import { Component, EventEmitter, Output, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { PlayerService } from 'app/services/player.service';
import { UserService } from 'app/services/user.service';
import { PlaylistBasicVM } from "../../models/api-view-models";
import { Subscription } from 'rxjs/Subscription';
import { SongOptionsContext } from "app/models/internal-models";
import { PlaylistsComponent } from "app/user/authuser/playlists/playlists.component";
import { PlayablesongOptionsComponent } from "app/user/authuser/playablesong-options/playablesong-options.component";
import { UserBasicVM } from 'app/models/api-view-models';


@Component({
  selector: 'authuser',
  templateUrl: './authuser.component.html',
  styleUrls: ['./authuser.component.css']
})
export class AuthuserComponent implements OnDestroy {

  constructor(
    private userService: UserService,
    private playerService: PlayerService, //necessary to play authuser playlists
    private ref: ChangeDetectorRef
  ) {
    //this is the component that is responsible to prompt the options menu requested to user
    //service by other services and components.
    this.mySubscriptions.push(
      this.userService.onShowPlayablesongOptions$.subscribe(
        songOptionsContext => { this.openPlayablesongOptions(songOptionsContext); }
      )
    );
  }

  //Auxiliary variable that stores the subscriptions of this component.
  //Those subscriptions should be unsubscribed on logout. 
  mySubscriptions: Subscription[] = [];

  //Defines basic info about the authenticated user (username)
  user: UserBasicVM = null;

  /**
   * To be called by UserComponent when creating this component (otherwise username has to be loaded from server)
   * @param user basic user info
   */
  public setUser(user: UserBasicVM) {
    this.user = user;
  }


  /**
   * Cleans up after authenticated user has logged out, and just
   * before this component is destroyed.
   */
  ngOnDestroy() {
    //unsubscribe all subscriptions
    this.mySubscriptions.forEach(x => x.unsubscribe());
    //clear all user data:
    this.userPlaylists = null;
    this.user = null;
    this.playlistsComponent = null;
  }


  //View Helper: informs the view about which menus should be displayed at any time. 
  show = { privatesongs: true, playlists: true, playablesongOptions: false };

  // ----- USER PLAYLISTS -----

  //Basic info about user playlists
  //This info is required by song options menu!
  userPlaylists: PlaylistBasicVM[];

  //Reference to playlists component
  @ViewChild(PlaylistsComponent)
  playlistsComponent: PlaylistsComponent;

  // ----- PLAYABLESONG OPTIONS -----

  //Reference to Playable Song Options component
  @ViewChild(PlayablesongOptionsComponent)
  playablesongOptionsComponent: PlayablesongOptionsComponent;

  //Representes the song options context for which the menu is being displayed.
  //Contains the information about the song(s) and optionally about its playable.
  songOptionsContext: SongOptionsContext = null;

  /**
   * Displays the menu with the options available for a given songOptionsContext info.
   * @param songOptionsContext the context info about the song and its playable.
   */
  openPlayablesongOptions(songOptionsContext) {

    //1) Load info about user playlists from playlists component
    if (this.playlistsComponent !== undefined)
      this.userPlaylists = this.playlistsComponent.playlists;

    this.songOptionsContext = songOptionsContext;

    //2) If playablesongOptions menu is already open, close it so that component is destroyed.
    //then open it again with the new context;
    if (this.playablesongOptionsComponent !== undefined) {
      this.show = { privatesongs: false, playlists: false, playablesongOptions: false };
      this.ref.detectChanges();
      setTimeout(() => this.openPlayablesongOptions(songOptionsContext), 500);
    }
    else
      this.show = { privatesongs: false, playlists: false, playablesongOptions: true };

  }

  /**
   * Closes the options menu, optionally passing the id of a playlist that
   * was modified, so that its info in player service can be updated (if such playlist is loaded).
   * @param playlistId The id of playlist that was modified in this options menu.
   */
  closePlayablesongOptions(playlistId: string) {
    if (playlistId != null)
      this.playerService.updatePlaylist(playlistId, false);
    this.songOptionsContext = null;
    this.show = { privatesongs: true, playlists: true, playablesongOptions: false };
  }

}
