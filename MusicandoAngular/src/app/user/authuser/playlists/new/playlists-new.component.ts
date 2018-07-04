import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { PlaylistBasicVM } from "../../../../models/api-view-models";
import { ApiPlaylistsService } from "app/api-module/api-playlists.service";
import { UserService } from 'app/services/user.service';
import { StateSwitch } from 'app/models/internal-models';

@Component({
  selector: 'playlists-new',
  templateUrl: './playlists-new.component.html'
})
export class PlaylistsNewComponent {

  constructor(
    private apiPlaylistsService: ApiPlaylistsService,
    private userService: UserService /*REGEX for playlist's name*/) { }

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'new playlist' functionality 
  showStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form")

  //View Helper: whether the close button should be enabled
  get allowClose(): boolean { return this.showStateSwitch.currentState === "form" }

  //Defines the name of the new playlist
  newPlaylistName: string = "";

  /**
   * Executes the request to create a new playlist
   * using apiPlaylistsService.
   */
  createPlaylist() {
    this.showStateSwitch.changeState("wait");
    if (!this.newPlaylistName.match(this.userService.PLAYLIST_NAME_PATTERN))
      return;
    this.apiPlaylistsService.newPlaylist(this.newPlaylistName).subscribe(
      data => { this.newFormSuccess(data); },
      err => { this.newFormFail(); });
  }

  /**
   * Handles a successful response to the request to create a new playlist
   * @param responseData Basic info about the playlist that was created
   */
  newFormSuccess(responseData: PlaylistBasicVM) {
    this.showStateSwitch.changeState("success");
    let newPlaylist: PlaylistBasicVM = responseData;
    setTimeout( () => this.close(newPlaylist), 1500);
  }

  /**
   * Handles an unsuccessfull response to the request to create a new playlist
   */
  newFormFail() {
    this.showStateSwitch.changeState("fail");
    setTimeout(() => {
      this.newPlaylistName = "";
      this.showStateSwitch.changeState("form");
    }, 1500);
  }

  //Event: informs the parent component that the user has closed this menu
  @Output() onClose = new EventEmitter<PlaylistBasicVM>();

  /**
   * Emits the 'onClose' event, optionally passing the info about the
   * playlist that was created
   * @param newPlaylist basic info about the playlist that was created
   */
  close(newPlaylist: PlaylistBasicVM = null) {
    this.onClose.emit(newPlaylist);
  }
}
