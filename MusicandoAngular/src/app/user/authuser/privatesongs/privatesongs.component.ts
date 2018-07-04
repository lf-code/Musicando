import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { ApiPrivatesongsService } from 'app/api-module/api-privatesongs.service';
import { PlayerService } from 'app/services/player.service';
import { PrivateSongBasicVM, PlaylistBasicVM, PlayableSongVM } from "app/models/api-view-models";
import { StateSwitch } from "app/models/internal-models";


@Component({
  selector: 'privatesongs',
  templateUrl: './privatesongs.component.html'
})
export class PrivateSongsComponent {

  constructor(private apiPrivatesongsService: ApiPrivatesongsService,
    private playerService: PlayerService) {
    //load private songs and the respective playlist:
    this.loadPrivateSongs();
    this.loadPrivateSongsPlaylist();
  }

  //The list of user's private songs
  privateSongs: PrivateSongBasicVM[] = [];

  //Basic info about the playlist of private songs
  privateSongsPlaylist: PlaylistBasicVM;

  //Defines the info about the private song for which
  //options are currently being displayed
  privateSongForOptions: PrivateSongBasicVM;

  //View Helper: gets whether the playlist of private songs exists and
  //has been loaded from the server
  get showPlayPlaylistButton(): boolean {
    return this.privateSongsPlaylist != undefined
      && this.privateSongs != undefined && this.privateSongs.length > 0;
  }

  //View Helper: gets whether user has any private songs
  get hasPrivateSongs(): boolean {
    return (this.privateSongs !== undefined && this.privateSongs.length > 0)
  }

  //View Helper: defines which menu to display in the view: the list of private songs,
  //the menu to create a private song, the menu with options for a song, etc.
  showStateSwitch: StateSwitch = new StateSwitch(["wait", "list", "newMenu", "optionsMenu", "error"], "wait")


  // ----- LOAD -----

  /**
   * Loads user's private songs from server using the ApiPrivatesongsService
   */
  loadPrivateSongs() {
    this.showStateSwitch.changeState("wait");
    this.apiPrivatesongsService.getAll().subscribe(
      data => {
        if (data !== undefined && data !== null) {
          this.privateSongs = data;
        }
        this.showStateSwitch.changeState("list");
      }, err => {
        console.log("[Privatesongs Component] : [ERROR] No PrivateSongs were loaded for the current user.");
        this.showStateSwitch.changeState("error");
      });
  }

  /**
   * Loads the playlist of user's private songs from server using the ApiPrivatesongsService
   */
  loadPrivateSongsPlaylist() {
    this.apiPrivatesongsService.getPlaylist().subscribe(
      data => {
        if (data !== undefined && data !== null) {
          this.privateSongsPlaylist = data;
        }
      }, err => {
        console.log("[Privatesongs Component] : [ERROR] No PrivateSong Playlist was loaded for the current user.");
      });
  }


  // ----- NEW -----

  /**
   * Displays the menu for creating a new private song
   */
  openNew() {
    this.showStateSwitch.changeState("newMenu");
  }

  /**
   * Closes the menu for creating a new private song,
   * optionally adding the recently created song to the
   * private songs' list.
   * @param recentlyCreatedSong
   */
  closeNew(recentlyCreatedSong: PrivateSongBasicVM) {

    if (recentlyCreatedSong !== undefined && recentlyCreatedSong !== null) {
      this.privateSongs.push(recentlyCreatedSong); //add new private song
      if (this.privateSongsPlaylist !== undefined)
        this.playerService.updatePlaylist(this.privateSongsPlaylist.playlistId, false);
    }
    this.showStateSwitch.changeState("list");
  }


  // ----- OPTIONS -----

  /**
   * Displays the menu with the options for a given private song
   * @param privateSong Info about the private song for which the options
   * menu is to be displayed
   */
  openOptions(privateSong: PrivateSongBasicVM) {
    this.privateSongForOptions = privateSong;
    this.showStateSwitch.changeState("optionsMenu");
  }

  /**
   * Closes the options menu, optionally updating the list
   * of private songs if the song is modified
   * @param modifiedPrivateSong
   */
  closeOptions(modifiedPrivateSong: PrivateSongBasicVM) {

    if (modifiedPrivateSong !== undefined && modifiedPrivateSong !== null) {

      let wasDeleted = modifiedPrivateSong.name === null;
      let index = this.privateSongs.findIndex(h => h.privateSongId == modifiedPrivateSong.privateSongId);

      if (wasDeleted)
        this.privateSongs.splice(index, 1); //If private song was deleted, remove it from the list
      else
        this.privateSongs[index].name = modifiedPrivateSong.name; //If private song name was modified, update it

      //update player, in case the modified song is loaded
      this.playerService.updatePrivateSong(modifiedPrivateSong, wasDeleted);
    }

    this.showStateSwitch.changeState("list");
  }

  // ----- PLAY -----

  /**
   * Executes a request to load and play the playlist of private songs
   * using the playerService
   */
  playPrivateSongPlaylist() {
    this.playerService.loadPlaylistFromServer(this.privateSongsPlaylist.playlistId);
  }

  /**
   * Executes a request to play a private song, through the playerService
   * (but first it loads the full PlayableSong info through the apiPrivatesongsService)
   * @param privateSong
   */
  playPrivateSong(privateSong: PrivateSongBasicVM) {
    this.apiPrivatesongsService.getPlayableSong(privateSong.privateSongId).subscribe(
      (data) => {
        this.playerService.playSingleSong(data);
      }
    );
  }
}
