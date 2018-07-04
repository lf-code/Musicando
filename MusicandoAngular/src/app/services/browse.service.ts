import { Injectable, EventEmitter, Output } from '@angular/core';
import { SongOptionsContext } from '../models/internal-models';
import {
  SearchResultVM, ArtistBasicVM, PublicPlaylistBasicVM,
  AlbumTrackVM, PlayableSongVM
} from '../models/api-view-models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { PlayerService } from 'app/services/player.service';
import { UserService } from 'app/services/user.service';
import { ApiBrowseService } from 'app/api-module/api-browse.service';

/**
 * The BrowseService allows the browse components and subcomponents to
 * communicated among them, and with other services.
 */
@Injectable()
export class BrowseService {

  constructor(private userService: UserService,
    private playerService: PlayerService,
    private apiBrowseService: ApiBrowseService) {

    // if user logs out, reset everything to default 
    this.userService.onUserLogout$.subscribe((X) => {
      this.artistReset();
      this.searchReset();
    })
  }


  // ----- PLAY -----
  
  /**
   * Tries to get playable song using ApiBrowseService, and handles the response.
   * If successful, plays song through the PlayerService,
   * otherwise logs an error message.
   * @param songId the songId of the album track to be played
   */
  playAlbumSong(songId: string) {
    console.log(`[Browse Service]: play album song ${songId}`);
    this.apiBrowseService.getAlbumSong(songId).subscribe(
      data => {
        if (data !== undefined && data !== null)
          this.playerService.playSingleSong(data);
      },
      err => console.log(`[Browse Service]: [ERROR] can´t play album song ${songId}`));
  }

  /**
   * Calls on the PlayerService to load and play a given album.
   * @param albumId the albumId of the album to be played
   */
  playAlbum(albumId: string) {
    console.log(`[Browse Service]: play album ${albumId}`);
    this.playerService.loadAlbumFromServer(albumId);
  }

  /**
   * Calls on the playerService to load and play a given public playlist.
   * @param publicPlaylistId the id of the public playlist to be played
   */
  playPublicPlaylist(publicPlaylistId: string) {
    console.log(`[Browse Service]: play public playlist ${publicPlaylistId}`);
    this.playerService.loadPublicPlaylistFromServer(publicPlaylistId);
  }

  // ----- PLAYABLESONGOPTIONS -----

  /**
   * Instructs userService to display song options for a given selection of songs.
   * @param songOptionsContext Object containing the information about selected songs,
   * and the context of their selection. 
   */
  showPlayablesongOptions(songOptionsContext: SongOptionsContext) {
    this.userService.showPlayablesongOptions(songOptionsContext);
  }


  // ----- SEARCH -----

  //Observable: Allows BrowseComponent to know when this service was instructed to display
  //a given searchResult (an album track, an album or an artist), so that it
  //change navtab to 'artist' before ArtistComponent displays the result.
  _onBrowseGoTo = new Subject<SearchResultVM>();
  $onBrowseGoTo = this._onBrowseGoTo.asObservable();

  /**
   * Emits a new search result, through the 'onBrowseGoTo' Observable,
   * which means that the BrowseService was instructed to go to that result.
   * @param searchResult the search result to be emited.
   */
  public goTo(searchResult: SearchResultVM) {
    this._onBrowseGoTo.next(searchResult); //First change navtab to 'artist' in browse component
  }

  //Observable: Allows the ArtistComponent matching a given searchResult object to be displayed
  //(also showing the album and highlighting a track if such is defined in the searchResult object)
  //All those artist components that do not match the searchResult Object, should reset and hide everything.
  //Besides the Search component, the Artist component also uses this observable, to communicate to other
  //artist components that it is going to show an album so they should be showing nothing.
  _onShow = new Subject<SearchResultVM>();
  $onShow = this._onShow.asObservable();

  /**
   * Emits an new search result, through the 'onShow' Observable.
   * @param searchResult the info about what is to be shown.
   */
  public show(searchResult: SearchResultVM) {
    this._onShow.next(searchResult);
  }

  // ----- RESET -----

  //Observable: Emits a signal to all ArtistComponents that they should reset
  // view to default (everything closed).
  _onArtistReset = new Subject();
  $onArtistReset = this._onArtistReset.asObservable();
  public artistReset() {
    this._onArtistReset.next();
  }


  //Observable: Emits a signal to SearchComponent to reset its state and view.
  _onSearchReset = new Subject();
  $onSearchReset = this._onSearchReset.asObservable();
  searchReset() {
    this._onSearchReset.next();
  }

}
