import { Component, Input, OnInit, OnDestroy, EventEmitter, Output, ChangeDetectorRef, ElementRef } from '@angular/core';
import { ApiPlayableService } from "app/api-module/api-playable.service";
import { PlaylistBasicVM, PlayableSongVM } from "../../../models/api-view-models";
import { SongOptionsContext } from "../../../models/internal-models";
import 'rxjs/add/operator/finally';

@Component({
  selector: 'playablesong-options',
  templateUrl: './playablesong-options.component.html'
})
export class PlayablesongOptionsComponent implements OnInit {

  constructor(private apiPlayableService: ApiPlayableService,

    private el: ElementRef) { }

  /**
   * When initializing the component set its state, considering the song options context
   */
  ngOnInit(): void {

    //1) Exclude the playlist in context from playlists available for adding:
    this.authuserPlaylistsAvailableForAdding = this.playlists.filter(
      x => this.songOptionsContext.playlist === null
        || x.playlistId !== this.songOptionsContext.playlist.playlistId);

    //2) By default, set selected playlist for adding to be the first one on the list:
    if (this.authuserPlaylistsAvailableForAdding.length > 0)
      this.selectedPlaylistForAdding = this.playlists[0];

    //3) By default, the new position is the current position:
    this.newPositionInPlaylist = this.songOptionsContext.songPositionInPlaylist;

    //4) Define which options/actions are available given the context:
    this.availableOptions.add = this.authuserPlaylistsAvailableForAdding.length > 0;
    this.availableOptions.remove = this.songOptionsContext.playlist !== null && !this.hasMultipleSongs;
    this.availableOptions.changePosition = this.songOptionsContext.playlist !== null
      && !this.hasMultipleSongs
      && this.songOptionsContext.maxPositionInPlaylist >= 1; //if there is more than one position

    this.availableOptions.noOptions =
      !this.availableOptions.add &&
      !this.availableOptions.remove &&
      !this.availableOptions.changePosition;

    //Always scroll the menu into view:
    this.el.nativeElement.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

  }

  //The object containing info about the context for which this options menu was called,
  //namely which song/songs to consider, and the playlist they are in, if any.
  @Input() songOptionsContext: SongOptionsContext;

  //The list of user's playlists
  @Input() playlists: PlaylistBasicVM[];

  //The user's playlists to which the song(s) in context can be added.
  authuserPlaylistsAvailableForAdding: PlaylistBasicVM[] = [];

  //The currently selected playlist to which song(s) will be added, if user chooses that action
  selectedPlaylistForAdding: PlaylistBasicVM; 

  //Gets whether the song options context provided has more than one song  
  get hasMultipleSongs() { return this.songOptionsContext.songs.length > 1 }

  //Determines which actions are available to the user, considering the context.
  availableOptions: any = { add: false, remove: false, changePosition: false, noOptions: true, waiting: false };

  //The new position a song will have in the playlist (both from context), if user chooses that action
  newPositionInPlaylist: number;

  /**
   * Allows user to increment/decrement the new position a song will have in the playlist
   * @param increment true to increment position, false to decrement 
   */
  changePosition(increment: boolean) {
    let n = this.newPositionInPlaylist + (increment ? 1 : -1);
    if (n >= 0 && n <= this.songOptionsContext.maxPositionInPlaylist)
      this.newPositionInPlaylist = n;
  }

  // ----- ACTIONS -----

  /**
   * Executes the option to add the song(s) to the chosen user playlist,
   * using the apiPlayableService
   */
  addSongsToSelectedPlaylist() {
    this.availableOptions.waiting = true;
    let songsIds: string[] = this.songOptionsContext.songs.map((v) => v.songId);
    this.apiPlayableService.addSongsToPlaylist(songsIds, this.selectedPlaylistForAdding.playlistId)
      .finally(() => this.availableOptions.waiting = false)
      .subscribe(
        data => { this.close(data["playlistId"]); },
        err => {
          console.log("[PlayableSong-Options Component] : [ERROR] Playlist was not modified. No Song was added.");
          this.close();
        }
      )
  }

  /**
   * Executes the option to remove the song from context playlist,
   * using apiPlayableService
   */
  removeSongFromPlaylist() {
    this.availableOptions.waiting = true;
    this.apiPlayableService.removeSongFromPlaylist(this.songOptionsContext.songs[0].songId, this.songOptionsContext.playlist.playlistId)
      .finally(() => this.availableOptions.waiting = false)
      .subscribe(
        data => { this.close(data["playlistId"]); },
        err => {
          console.log("[PlayableSong-Options Component] : [ERROR] Playlist was not modified. No Song was removed.");
          this.close();
        }
      );

  }

  /**
   * Executes the option to change the song's position on the playlist in context,
   * using the apiPlayableService
   */
  changeSongPositionInPlaylist() {
    this.availableOptions.waiting = true;
    if (this.newPositionInPlaylist != this.songOptionsContext.songPositionInPlaylist) {
      this.apiPlayableService.changePositionInPlaylist(
        this.songOptionsContext.songs[0].songId,
        this.songOptionsContext.playlist.playlistId, this.newPositionInPlaylist)
        .finally(() => this.availableOptions.waiting = false)
        .subscribe(
          data => { this.close(data["playlistId"]); },
          err => {
            console.log("[PlayableSong-Options Component] : [ERROR] Playlist was not modified. Position unchanged!");
            this.close();
          }
        );
    }
  }


  //Event: informs the parent component that the user has closed this menu
  @Output() onClose = new EventEmitter<string>();

  /**
  * Emits the 'onClose' event, optionally passing the info about a
  * playlist that has been modified.
  * @param playlistId The id of the playlist that has been modified.
  */
  close(playlistId: string = null) {
    this.onClose.emit(playlistId);
  }

}
