import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { PlaylistBasicVM } from "../../../models/api-view-models";
import { StateSwitch } from 'app/models/internal-models';
import { ApiPlaylistsService } from "app/api-module/api-playlists.service";
import { PlayerService } from 'app/services/player.service';

@Component({
  selector: 'playlists',
  templateUrl: './playlists.component.html'
})
export class PlaylistsComponent {

  constructor(private apiPlaylistsService: ApiPlaylistsService, private playerService: PlayerService) {

    //load playlists:
    this.showStateSwitch.changeState("wait");
    this.apiPlaylistsService.getAll().subscribe(
      data => {
        this.playlists = data;
        this.showStateSwitch.changeState("playlists");
      },
      err => {
        console.log("[Playlists Component]: [ERROR] No playlists were loaded for the current user.");
        this.showStateSwitch.changeState("error");
      }
    );

  }

  //the list of playlists (basic info only: name, id)
  playlists: PlaylistBasicVM[] = [];

  //View helper: gets if user currently has any playlist
  get hasPlaylists(): boolean { return this.playlists != undefined && this.playlists.length > 0; };

  //Info about the playlist for which options are being displayed
  playlistForOptions: PlaylistBasicVM;

  //View Helper: defines what to display: the list of playlists,
  //the menu with options for a selected playlist, a menu for creating a playlist
  showStateSwitch: StateSwitch = new StateSwitch(["playlists", "new", "options", "wait", "error"], "wait")

  /**
   * Displays the list of user's playlists
   */
  showPlaylists() {
    this.showStateSwitch.changeState("playlists");
  }

  /**
   * Displays the menu for creating a new playlist
   */
  showNew() {
    this.showStateSwitch.changeState("new");
  }

  /**
   * Displays the menu with options the a given playlist
   * @param playlist the info about the playlist for which to show options
   */
  showOptions(playlist: PlaylistBasicVM) {
    this.playlistForOptions = playlist;
    this.showStateSwitch.changeState("options");
  }

  // ----- ACTIONS -----

  /**
   * Asks PlayerService to load and play a given playlist
   * @param playlist the playlist to be played
   */
  playPlaylist(playlist: PlaylistBasicVM) {
    this.playerService.loadPlaylistFromServer(playlist.playlistId);
  }

  /**
   * Adds a playlist to the list of playlists
   * @param newPlaylist the playlist to be added
   */
  addPlaylist(newPlaylist: PlaylistBasicVM) {
    if (newPlaylist !== undefined && newPlaylist !== null)
      this.playlists.push(newPlaylist);
    this.showPlaylists();
  }

  /**
   * Updates the list of playlists when a playlist is modified
   * @param changedPlaylist the playlist that was modified
   */
  changePlaylist(changedPlaylist: PlaylistBasicVM) {

    if (changedPlaylist !== undefined && changedPlaylist !== null) {
      //find the playlist in list
      let index = this.playlists.findIndex(h => h.playlistId == changedPlaylist.playlistId);
      
      if (changedPlaylist.name === null) { //Remove it, if it was deleted by the user
        this.playlists.splice(index, 1);
        this.playerService.updatePlaylist(changedPlaylist.playlistId, true); //Update player
      }
      else {
        this.playlists[index].name = changedPlaylist.name; //Update it, if it was just modified
        this.playerService.updatePlaylist(changedPlaylist.playlistId, false); //Update player
      }
    }

    this.showPlaylists();
  }
}
