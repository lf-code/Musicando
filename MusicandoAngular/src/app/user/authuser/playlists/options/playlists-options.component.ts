import { Component, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { PlaylistBasicVM } from "../../../../models/api-view-models";
import { ApiPlaylistsService } from "app/api-module/api-playlists.service";
import { UserService } from "app/services/user.service";
import { StateSwitch } from 'app/models/internal-models';

@Component({
  selector: 'playlists-options',
  templateUrl: './playlists-options.component.html'
})
export class PlaylistsOptionsComponent {

  constructor(private apiPlaylistsService: ApiPlaylistsService,
    private userService: UserService /*REGEX for playlist name*/) { }

  //Defines the basic info about the playlist for which these
  //options are being displayed
  @Input() playlistForOptions: PlaylistBasicVM = new PlaylistBasicVM();

  //View Helper: whether the close button should be enabled
  get allowClose(): boolean {
    return this.changeStateSwitch.currentState === "form" &&
      this.deleteStateSwitch.currentState === "form"
  }


  // ----- CHANGE NAME OPTION -----

  //View Helper: defines what to display depending on the state of
  //the form that implements the 'change playlist name' functionality 
  changeStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form")

  //Defines the new name for the playlist
  newName: string = "";

  /**
   * Executes a request to change the name of the playlist,
   * using the apiPlaylistsService.
   */
  changeNamePlaylist() {
    this.changeStateSwitch.changeState("wait");
    this.apiPlaylistsService.editPlaylist(this.playlistForOptions.playlistId, this.newName).subscribe(
      data => { this.changeNameFormSuccess(data) },
      err => { this.changeNameFormFail() });
  }

  /**
   * Handles a successful response to the request to change the name of the playlist
   * @param dataResponse
   */
  changeNameFormSuccess(dataResponse: PlaylistBasicVM) {
    this.changeStateSwitch.changeState("success");
    let changedPlaylist: PlaylistBasicVM = dataResponse;
    setTimeout((function () { this.close(changedPlaylist); }).bind(this), 1500);
  }

  /**
   * Handles an unsuccessful response to the request to change
   * the name of the playlist
   */
  changeNameFormFail() {
    this.changeStateSwitch.changeState("fail");
    setTimeout((function () { this.changeStateSwitch.changeState("form"); }).bind(this), 1500);
  }


  // ----- DELETE OPTION -----

  //View Helper: defines what to display depending on the state of
  //the form that implements the 'delete playlist' functionality 
  deleteStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form");

  /**
   * Executes the request to delete a playlist, using the apiPlaylistsService
   */
  deletePlaylist() {
    this.deleteStateSwitch.changeState("wait");
    this.apiPlaylistsService.deletePlaylist(this.playlistForOptions.playlistId).subscribe(
      data => { this.deleteFormSuccess(data) },
      err => { this.deleteFormFail() });
  }

  /**
   * Handles a successfull response to the request to delete a playlist
   * @param dataResponse basic info about the playlist that was just deleted
   */
  deleteFormSuccess(dataResponse: PlaylistBasicVM) {
    this.deleteStateSwitch.changeState("success");
    let changedPlaylist: PlaylistBasicVM = dataResponse;
    setTimeout( () => this.close(changedPlaylist) , 1500);
  }

  /**
   * Handles an unsuccessful reponse to the request to delete a playlist
   */
  deleteFormFail() {
    this.deleteStateSwitch.changeState("fail");
    setTimeout(() => this.deleteStateSwitch.changeState("form"), 1500);
  }

  // ----- CLOSE -----

  //Event: informs the parent component that the user has closed this menu
  @Output() onClose = new EventEmitter<PlaylistBasicVM>();

  /**
   * Emits the 'onClose' event, optionally passing the info about the
   * playlist that was modified
   * @param playlistModified
   */
  close(playlistModified: PlaylistBasicVM = null) {
    this.onClose.emit(playlistModified);
  }
}
