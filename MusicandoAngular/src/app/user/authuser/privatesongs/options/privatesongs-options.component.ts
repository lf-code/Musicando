import { Component, EventEmitter, Output, Input, OnDestroy, OnInit } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { ApiPrivatesongsService } from 'app/api-module/api-privatesongs.service';
import { PrivateSongBasicVM, SongBasicVM } from "app/models/api-view-models";
import { PrivateSongBM } from "app/models/api-binding-models";
import { SongOptionsContext, StateSwitch } from "app/models/internal-models";


@Component({
  selector: 'privatesongs-options',
  templateUrl: './privatesongs-options.component.html'
})
export class PrivateSongsOptionsComponent implements OnInit {

  constructor(private apiPrivatesongsService: ApiPrivatesongsService,
    private userService: UserService) { }

  /**
   * When initializing the component, reset the binding model,
   * and load the full information from the server 
   */
  ngOnInit(): void {
    this.editedPrivateSong = new PrivateSongBM();
    this.loadPrivateSong();
  }

  //The information about the private song for
  //which this options menu is being displayed
  @Input() privateSongForOptions: PrivateSongBasicVM;

  //View Helper: whether close button should be enabled
  get allowClose(): boolean {
    return this.editStateSwitch.currentState === "show"
      && this.deleteStateSwitch.currentState === "show"
  }


  /**
   * Helper method that switches the multiple options on and off
   * @param targetStates object that defines, for each option, whether it should be hidden
   */
  changeSwitches(targetStates) {
    if (targetStates.editState != undefined)
      this.editStateSwitch.changeState(targetStates.editState);
    if (targetStates.deleteState != undefined)
      this.deleteStateSwitch.changeState(targetStates.deleteState);
    if (targetStates.addToPlaylistState != undefined)
      this.addToPlaylistStateSwitch.changeState(targetStates.addToPlaylistState);
  }



  // ----- LOAD INFO -----

  //View Helper: defines what to display depending on the state
  //of the request to load from server all info about the private song
  loadStateSwitch: StateSwitch = new StateSwitch(["wait", "success", "fail"], "wait");

  /**
   * Executes the request to load all info from server about
   * the current private song for which options are being displayed
   * using the apiPrivatesongsService
   */
  loadPrivateSong() {
    this.loadStateSwitch.changeState("wait");
    this.apiPrivatesongsService.getInfo(this.privateSongForOptions.privateSongId).subscribe(
      data => { this.loadSuccess(data); },
      err => this.loadFail());
  }

  /**
   * Handles a successfull response to the request to load info from server
   * @param data the data loaded
   */
  loadSuccess(data) {
    this.editedPrivateSong = data;
    this.loadStateSwitch.changeState("success");
  }

  /**
  * Handles an unsuccessfull response to the request to load info from server
  */
  loadFail() {
    console.log("[Privatesong-Options Component]: [ERROR] Couldn't load info from server");
    this.loadStateSwitch.changeState("fail");
    setTimeout(() => this.close(null), 1500);
  }



  // ----- EDIT OPTION -----

  //The binding model that contains the information for editing the private song
  editedPrivateSong: PrivateSongBM;

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'edit private song' functionality 
  editStateSwitch: StateSwitch = new StateSwitch(["hidden", "show", "wait", "success", "fail"], "show")

  /**
   * Executes the request to edit the information of a private song
   * using the apiPrivatesongsService
   */
  editPrivateSong() {
    this.changeSwitches({ editState: "wait", deleteState: "hidden", addToPlaylistState: "hidden" });
    this.apiPrivatesongsService.edit(this.privateSongForOptions.privateSongId, this.editedPrivateSong).subscribe(
      data => this.editFormSuccess(data),
      err => this.editFormFail());
  }

  /**
   * Handles a successful response to the request to edit the information of a private song
   * @param dataResponse Basic info about the private song that was just edited
   */
  editFormSuccess(dataResponse) {
    this.changeSwitches({ editState: "success", deleteState: "hidden", addToPlaylistState: "hidden" });
    setTimeout(() => this.close(dataResponse), 1500);
  }

  /**
  * Handles an unsuccessfull response to the request to edit the information of a private song
  */
  editFormFail() {
    console.log("[Privatesong-Options Component]: [ERROR] Couldn't edit private song");
    this.changeSwitches({ editState: "fail", deleteState: "hidden", addToPlaylistState: "hidden" });
  }



  // ----- DELETE OPTION -----

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'delete private song' functionality 
  deleteStateSwitch: StateSwitch = new StateSwitch(["hidden", "show", "wait", "success", "fail"], "show")


  /**
  * Executes the request to delete the private song using the apiPrivatesongsService
  */
  deletePrivateSong() {
    this.changeSwitches({ editState: "hidden", deleteState: "wait", addToPlaylistState: "hidden" });
    this.apiPrivatesongsService.delete(this.privateSongForOptions.privateSongId).subscribe(
      data => this.deleteFormSuccess(data),
      err => this.deleteFormFail());
  }

  /**
  * Handles a successful response to the request to delete the private song
  * @param dataResponse Basic info about the private song that was just deleted
  */
  deleteFormSuccess(dataResponse) {
    console.log("Private song deleted!");
    this.changeSwitches({ editState: "hidden", deleteState: "success", addToPlaylistState: "hidden" });
    setTimeout(() => this.close(dataResponse), 1500);
  }

  /**
  * Handles an unsuccessfull response to the request to delete the private song
  */
  deleteFormFail() {
    console.log("[Privatesong-Options Component]: [ERROR] Couldn't delete private song");
    this.changeSwitches({ editState: "hidden", deleteState: "fail", addToPlaylistState: "hidden" });
  }



  // ----- ADD TO PLAYLIST OPTION -----

  //View Helper: defines what to display depending on the state of the
  //form that implements the 'add private song to an user playlist' functionality 
  addToPlaylistStateSwitch: StateSwitch = new StateSwitch(["hidden", "show"], "show"); 

  addToPlaylist() {
    //1) hide all forms
    this.changeSwitches({ editState: "hidden", deleteState: "hidden", addToPlaylistState: "hidden" });

    //2) build a song options context for the private song
    let songOptionsContext: SongOptionsContext = new SongOptionsContext();
    songOptionsContext.songs = [];
    let aux = new SongBasicVM();
    aux.songId = this.privateSongForOptions.songId;
    aux.name = this.privateSongForOptions.name;
    aux.artistName = this.privateSongForOptions.name;
    aux.albumName = this.privateSongForOptions.name;
    songOptionsContext.songs.push(aux);

    //3) call the song options menu using the userService, and close this menu
    this.userService.showPlayablesongOptions(songOptionsContext);
    this.close();
  }



  //Event: informs parent component that the user has closed this menu
  @Output() onClose = new EventEmitter<PrivateSongBasicVM>();

  /**
  * Emits the 'onClose' event, optionally passing the information about the
  * privateSong that was modified
  * @param modifiedPrivateSong basic information about the private song that was modified
  */
  close(modifiedPrivateSong: PrivateSongBasicVM = null) {
    this.onClose.emit(modifiedPrivateSong);
  }

}
