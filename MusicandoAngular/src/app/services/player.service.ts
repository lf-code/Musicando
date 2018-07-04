import { Injectable } from '@angular/core';
import { PlayableVM, PlayableSongVM, PlaylistBasicVM, PrivateSongBasicVM } from '../models/api-view-models';
import { YtPlayerState, SongOptionsContext } from '../models/internal-models';
import { ApiPlayableService } from 'app/api-module/api-playable.service';
import { UserService } from 'app/services/user.service';
import { ApiPrivatesongsService } from 'app/api-module/api-privatesongs.service';
import { Subject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators/finalize';


/**
 * PlayerServices allows users to play a song or a playlist using the youtube player.
 */
@Injectable()
export class PlayerService {

  constructor(
    private apiPlayableService : ApiPlayableService,
    private userService: UserService,
    private apiPrivatesongsService: ApiPrivatesongsService
  ) {
    this.resetPlayer(true);
    this.userService.onUserLogout$.subscribe((x) => { this.resetPlayer(); });
  }

  // ----- PLAYER INTERNAL STATE MANAGEMENT -----

  //Represents the basic info about the state of the player
  public currentYtPlayerState: YtPlayerState;

  //Defines if the player is currently playing an isolated song without a playable context.
  public isPlayingSingleSong = false;


  //Observable: informs interested subscribers that the state
  //of the player has just changed
  _stateUpdated = new Subject();
  public onStateUpdate$ = this._stateUpdated.asObservable();

  //Observable: informs components, namely yt-component, if 'next' and/or 'prev' nav options
  //should be enabled or disabled
  _updateNavCommands = new Subject();
  public onUpdateNavCommands$ = this._updateNavCommands.asObservable();

  //Observable: informs components that the state of the player has been reset
  _reset = new Subject();
  public onPlayerReset$ = this._reset.asObservable();

  //Observable: instructs the components to play a given song
  _playSong = new Subject<PlayableSongVM>();
  public onPlaySong$ = this._playSong.asObservable();


  /**
   * Enables callers to update the state of the player. Callers should
   * provide a new player state. 
   * @param newYtPlayerState
   */
  public updateYtPlayerState(newYtPlayerState: YtPlayerState) {

    //Aux temporary variables that store whether 'shuffle' and 'repeat' have changed
    // with the new state (evaluate before overwrite the current state).
    let repeatOnChanged = newYtPlayerState.repeatOn != this.currentYtPlayerState.repeatOn;
    let shuffleOnChanged = newYtPlayerState.shuffleOn != this.currentYtPlayerState.shuffleOn;

    this.currentYtPlayerState = newYtPlayerState;

    //If 'shuffle' state has changed, the playing order of
    //the current playable should be updated
    if (shuffleOnChanged)
      this.setPlayingOrder();

    //If 'repeat' state has changed, nav commands should be updated
    if (repeatOnChanged)
      this.updateNavCommands();

    //Emit the new state
    this._stateUpdated.next();
  }

  /**
   * Emits a new state for nav commands, according to the current player state
   */
  updateNavCommands() {
    let data = {};
    data["hasPrev"] = !this.isPlayingSingleSong && this.getPrevPlayingOrderIndex(this.currentIndexInPlayingOrder) != null;
    data["hasNext"] = !this.isPlayingSingleSong && this.getNextPlayingOrderIndex(this.currentIndexInPlayingOrder) != null;
    this._updateNavCommands.next(data);
  }



  // ----- INTERNAL HELPERS FOR PLAYING ORDER -----

  //Array of indexes of currentPlayable.playableSongs array,
  //sorted by the order they should be played
  playingOrder: number[]; 

  //Stores the index of the currently playing song in PlayingOrder array.
  currentIndexInPlayingOrder: number;


  /**
   * Defines what should be the actual playing order of the songs
   * in currently loaded playable, taking into account if 'shuffle' is on or not,
   * and ignoring unavailable videos.
   */
  setPlayingOrder() {

    //Temporarily save the index in playable of the playing song.
    let saveIndexInPlayable;
    if (this.currentIndexInPlayingOrder !== undefined)
      saveIndexInPlayable = this.playingOrder[this.currentIndexInPlayingOrder];

    //Get the indexes of the songs in current Playable,
    //ignoring those with unavailable videos.
    let i = 0;
    this.playingOrder = [];
    for (let s of this.currentPlayable.playableSongs) {
      if (s.videoUrl !== null)
        this.playingOrder.push(i);
      i++;
    }

    //if 'shuffle' is on sort the indexes randomly
    if (this.currentYtPlayerState.shuffleOn)
      this.playingOrder.sort((a, b) => Math.random() > Math.random() ? 1 : -1);

    //Use the previously saved index of the currently playing song,
    //to set the current index in the new playing order of such song.  
    this.currentIndexInPlayingOrder = this.playingOrder.indexOf(saveIndexInPlayable);
  }


  /**
   * Aux method that, from a given index, retrieves the index (in playing order) of
   * the next song to be played, taking into account 'repeat' state.
   * Returns null if there is no next song.
   * @param i an index in playing order array
   */
  getNextPlayingOrderIndex(i: number) {

    if (i == this.playingOrder.length - 1)
      return this.currentYtPlayerState.repeatOn ? 0 : null;
    else
      return i + 1;
  };


  /**
   * Aux method that, from a given index, retrieves the index (in playing order) of
   * the previous song to be played, taking into account 'repeat' state.
   * Returns null if there is no previous song.
   * @param i an index in playing order array
   */
  getPrevPlayingOrderIndex(i: number) {
    if (i == 0)
      return this.currentYtPlayerState.repeatOn ? this.playingOrder.length - 1 : null;
    else
      return i - 1;
  };


  // ----- PLAY SONG -----


  /**
   * Plays an isolated song (with no playable context) provided by the caller
   * (UserService for private songs, BrowseService for album tracks).
   * @param song The playable song to be played.
   */
  public playSingleSong(song: PlayableSongVM) {
    this.playSong(song, true);
  }


  /**
   * Plays a song in playable, given its position in playable
   * (User selects a song in loaded playable)
   * @param indexInPlayable the index of the song in playable array.
   */
  public playSongFromPlayableIndex(indexInPlayable: number) {
    //Find the respective index in the playing order array, and play the song
    //from there so the playing order still holds when the song ends.
    this.playSongFromPlayingOrder(this.playingOrder.indexOf(indexInPlayable));
  }


  /**
   * Plays the previous song in playing order.
   */
  public playPrev() {
    let i = this.getPrevPlayingOrderIndex(this.currentIndexInPlayingOrder)
    this.playSongFromPlayingOrder(i);
  };


  /**
   * Plays the next song in playing order.
   */
  public playNext() {
    let i = this.getNextPlayingOrderIndex(this.currentIndexInPlayingOrder);
    this.playSongFromPlayingOrder(i);
  };


  /**
   * Plays a given song given its index in playing order.
   * (internal method of player service - private methods do not compile)
   * @param indexInPlayingOrder the index of the song in playing order.
   */
  playSongFromPlayingOrder(indexInPlayingOrder: number) {
    if (indexInPlayingOrder != null) {
      this.currentIndexInPlayingOrder = indexInPlayingOrder;
      let indexInPlayable = this.playingOrder[indexInPlayingOrder];
      let actualSongToBePlayed = this.currentPlayable.playableSongs[indexInPlayable];
      this.playSong(actualSongToBePlayed, false);
    }
  }

  /**
   * Emits the 'play' info that will be used by the components to
   * play the song in youtube played and update their state.
   * (internal method of played - private methods do not compile)
   * @param songToBePlayed playableSong object with the info of the song to be played.
   * @param isSingleSong whether the song is isolated (without playable context)
   */
  playSong(songToBePlayed: PlayableSongVM, isSingleSong: boolean) {
    this.isPlayingSingleSong = isSingleSong;
    this._playSong.next(songToBePlayed);
    this.updateNavCommands();
  }


  // ----- PLAYABLE -----

  //Represents the playable currently loaded
  public currentPlayable: PlayableVM;

  //View Helper: informs interested components that this service is waiting for a
  //response from the server regarding a playable to be loaded.
  waitForServer = { loading: false };


  /**
   * Loads the playable of a playlist from server through ApiPlaylistsService
   * @param playlistId 
   */
  public loadPlaylistFromServer(playlistId: string) {
    this.waitForServer.loading = true;
    this.apiPlayableService.getPlaylist(playlistId)
      .pipe(finalize(() => this.waitForServer.loading = false))
      .subscribe(
      data => this.loadPlayable(data),
      err => console.log("[Player Service]: [ERROR] Playlist playable was not loaded.")
      );
  }


  /**
  * Loads the playable of the default playlist from server through ApiPlaylistsService
  */
  public loadDefaultPlaylistFromServer() {
    this.waitForServer.loading = true;
    this.apiPlayableService.getDefaultPlaylist()
      .pipe(finalize(() => this.waitForServer.loading = false))
      .subscribe(
      data => this.loadPlayable(data),
      err => console.log("[Player Service]: [ERROR] Default playlist playable was not loaded.")
      );
  }


  /**
  * Loads the playable of a public playlist from server through ApiPlaylistsService
  * @param publicPlaylistId
  */
  public loadPublicPlaylistFromServer(publicPlaylistId: string) {
    this.waitForServer.loading = true;
    this.apiPlayableService.getPublicPlaylist(publicPlaylistId)
      .pipe(finalize(() => this.waitForServer.loading = false))
      .subscribe(
      data => this.loadPlayable(data),
      err => console.log("[Player Service]: [ERROR] Public playlist playable was not loaded.")
      );
  }


  /**
   * Loads the playable of an album from server through ApiPlaylistsService
   * @param albumId
   */
  public loadAlbumFromServer(albumId: string) {
    this.waitForServer.loading = true;
    this.apiPlayableService.getAlbum(albumId)
      .pipe(finalize(() => this.waitForServer.loading = false))
      .subscribe(
      data => this.loadPlayable(data),
      err => console.log("[Player Service]: [ERROR] Album playable was not loaded.")
      );
  }


  /**
   * Sets up a playable that has just been loaded succesfully from the server.
   * @param playableVM the playable info
   */
  loadPlayable(playableVM: PlayableVM) {

    let isTheSamePlayable = this.currentPlayable !== undefined && playableVM.playableId === this.currentPlayable.playableId;

    //Sort playable songs by song position:
    playableVM.playableSongs.sort((s1, s2) => s1.position - s2.position);

    this.currentPlayable = playableVM;

    if (playableVM.playableSongs.length > 0) {

      this.setPlayingOrder();

      //By default loading always cues the first song in the playlist, but if it is the same playable,
      //and there is a song loaded/playing, and such song is still in the playable, keep it loaded/playing.
      //(useful the loaded playable is updated, that is, when songs are added or removed, order changed, etc)
      if (isTheSamePlayable && this.currentPlayable.playableSongs.some(
        value => value.songId == this.currentYtPlayerState.loadedSongId)) {

        //Keep the song playing:
        let position = this.currentPlayable.playableSongs.filter(
          x => x.songId == this.currentYtPlayerState.loadedSongId)[0].position;

        //update state info (index may have changed and we are not calling 'play'):
        this.currentIndexInPlayingOrder = this.playingOrder.indexOf(position);
        this.updateNavCommands();

      } else {
        //play from beginning
        this.playSongFromPlayingOrder(0);
      }

    }
  }



  // ----- SHOW PLAYABLESONG OPTIONS -----

  /**
   * Asks the UserService to show the options for a song being played, or in playable.
   * @param song the song for which options should be displayed
   * @param isFromPlayable whether the song is in the playable or isolated
   */
  public showPlayablesongOptions(song: PlayableSongVM, isFromPlayable: boolean) {

    //Fill in a songOptionsContext object to be sent through the player service:
    let songOptionsContext: SongOptionsContext = new SongOptionsContext();
    songOptionsContext.songs = [song];

    //If playable is an user playlist, add playlist info to songOptionsContext
    //as user playlists may be edited: song may be removed or its position changed:
    if (isFromPlayable && this.currentPlayable.type == "Playlist") {

      songOptionsContext.playlist = new PlaylistBasicVM();
      songOptionsContext.playlist.playlistId = this.currentPlayable.typeId;
      songOptionsContext.playlist.name = this.currentPlayable.name;

      songOptionsContext.songPositionInPlaylist = song.position;
      songOptionsContext.maxPositionInPlaylist = this.currentPlayable.playableSongs.length - 1;
    }

    this.userService.showPlayablesongOptions(songOptionsContext);
  }



  // ----- UPDATE TRIGGERED BY USER ACTIONS -----


  /**
   * Reset the player service, initially called when ytplayer is ready,
   * and then again when the user logs off
   * @param isInitialReset
   */
  public resetPlayer(isInitialReset: boolean = false) {

    // initialize playable
    let p = new PlayableVM();
    p.name = "Sem Playlist";
    p.typeId = null;
    p.playableId = null;
    p.playableSongs = [];
    this.currentPlayable = p;

    // reset YtPlayerState
    this.currentYtPlayerState = new YtPlayerState();

    // initial reset doesn't load default playlist, waits for ytplayer to be ready
    if (!isInitialReset)  
      this.loadDefaultPlaylistFromServer();

    this._reset.next();
  }


  /**
   * Updates a playable of a user playlist that has been changed by the user
   * @param playlistId the playlistId (not playableId)
   * @param wasDeleted whether the playlist was deleted or just modified
   */
  public updatePlaylist(playlistId: string, wasDeleted: boolean = false) {

    if (playlistId === this.currentPlayable.typeId) {
      if (wasDeleted) //if playlist was deleted, load default playlist
        this.loadDefaultPlaylistFromServer();
      else
        this.loadPlaylistFromServer(playlistId); //reload playable from server
    }

  }


  /**
   * updates the info of a private song that has been changed by the user
   * @param privateSong private song info
   * @param wasDeleted whether the privateSong was deleted or just modified
   */
  public updatePrivateSong(privateSong: PrivateSongBasicVM, wasDeleted: boolean = false) {

    // 1) update isolated song if it is the modified privatesong
    if (this.isPlayingSingleSong && privateSong.songId === this.currentYtPlayerState.loadedSongId) {
      if (wasDeleted) //private song was deleted when playing independently, load default playlist
        this.loadDefaultPlaylistFromServer();
      else {
        //if not deleted, load it and play it again
        this.apiPrivatesongsService.getPlayableSong(privateSong.privateSongId).subscribe(
          data => {
            if (data != undefined)
              this.playSingleSong(data)
          });
      }
    }

    // 2) update loaded playable if it contains the modified privatesong (by loading it again)
    let containsSong: boolean = this.currentPlayable.playableSongs.filter(x => x.songId === privateSong.songId).length > 0;
    if (containsSong) {
      this.updatePlaylist(this.currentPlayable.typeId); //load updated playable info
    }

  }

}

