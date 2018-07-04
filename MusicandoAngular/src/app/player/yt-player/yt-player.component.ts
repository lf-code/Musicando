import { Component, ChangeDetectorRef } from "@angular/core";
import { PlayerService } from "app/services/player.service";
import { PlayableSongVM } from "../../models/api-view-models";
import { YtPlayerState } from "../../models/internal-models";
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'yt-player',
  templateUrl: './yt-player.component.html'
})
export class YtPlayerComponent {

  constructor(private playerService: PlayerService, private ref: ChangeDetectorRef) {

    //When youtube api is ready, subscribe "onStateChangeEvents" from youtube api
    window.addEventListener("onPlayerReady", (x) => {
      this.ready = true;
      this.playerService.resetPlayer();
      window["player"].addEventListener("onStateChange", (x) => this.onYoutubePlayerStateChange(x.data));

    });

    //Plays a new song when instructed to do so by PlayerService
    playerService.onPlaySong$.subscribe((data) => {
      this.play(data);
    })

    //Updates the states of 'next'/'prev' based on information provided by PlayerService 
    playerService.onUpdateNavCommands$.subscribe((data) => {
      this.hasPrev = data["hasPrev"];
      this.hasNext = data["hasNext"];
    })

  }

  // ----- INTERNAL HELPERS -----

  /**
   * Instructs Youtube player to load and play a given song
   * @param song song data for youtube player
   */
  play(song: PlayableSongVM) {
    this.currentSong = song;
    this.ytplayer.loadVideoById({
      'videoId': song.videoUrl, 'startSeconds': Number(song.startSec),
      'endSeconds': Number(song.endSec), 'suggestedQuality': 'large'
    });
  }

  //Gets the actual youtube player object
  get ytplayer() {
    return window["player"];
  }

  //Defines whether the actual youtube player is loaded and ready
  ready: boolean = false;

  //Defines if 'prev' button should be enabled (if true) or disabled (if false)
  hasPrev: boolean = false;

  //Defines if 'next' button should be enabled (if true) or disabled (if false)
  hasNext: boolean = false;


  // ----- YTPLAYER INTERNAL STATE ----- 

  //Defines if 'shuffle' toggle is on. (Whenever its value changes, emit a new internal state);
  _shuffleOn: boolean = false;
  get shuffleOn(): boolean { return this._shuffleOn; }
  set shuffleOn(boolean: boolean) { this._shuffleOn = boolean; this.newYtPlayerState(); }

  //Defines if 'repeat' toggle is on. (Whenever its value changes, emit a new internal state);
  _repeatOn: boolean = false;
  get repeatOn(): boolean { return this._repeatOn; }
  set repeatOn(boolean: boolean) { this._repeatOn = boolean; this.newYtPlayerState(); }

  //Defines whether a song is currently playing 
  isPlaying: boolean = false;

  /**
   * Updates 'isPlaying' value taking into account the state of the youtube player.
   * 'isPlaying' is true only if the player is fully operational and its state equals 'PLAYING' (1)
   */
  updateIsPlaying() {
    this.isPlaying =
      this.ready
      && this.ytplayer !== undefined
      && typeof this.ytplayer['getPlayerState'] == 'function'
      && (this.ytplayer.getPlayerState() == 1);
  }

  //Defines which song is currently loaded in youtube player.
  currentSong: PlayableSongVM;
   
  /**
   * Sets a new, updated, internal state and informs the player service about it.
   */
  newYtPlayerState() {

    this.updateIsPlaying();

    let newState: YtPlayerState = new YtPlayerState();
    newState.isPlaying = this.isPlaying;
    newState.shuffleOn = this.shuffleOn;
    newState.repeatOn = this.repeatOn;
    newState.loadedSongId = this.currentSong.songId;

    //Inform player service about the new state:
    this.playerService.updateYtPlayerState(newState); 

    this.ref.detectChanges(); //Force view update
  }


  // ----- YT-PLAYER COMMANDS -----

  /**
   * Handles 'play/pause' button click
   */
  togglePlay() {
    if (this.isPlaying) {
      this.ytplayer.pauseVideo();
    } else {
      this.ytplayer.playVideo();
    }
  }

  /**
   * Handles 'next' button click
   */
  next() {
    this.playerService.playNext();
  }

  /**
   * Handles 'prev' button click
   */
  prev() {
    this.playerService.playPrev();
  }

  /**
   * Handles 'repeat' button click
   */
  toggleRepeat() {
    this.repeatOn = !this.repeatOn;
  }

  /**
   * Handles 'shuffle' button click
   */
  toggleShuffle() {
    this.shuffleOn = !this.shuffleOn;
    //shuffleOn requires repeatOn, otherwise it occurs a strange
    //behavior (no 'next' if playing song is at the end of shuffled list):
    if (this.shuffleOn)
      this.repeatOn = true;
  }

  //Aux variable, stores last state of Youtube Player
  lastState: number = -2;

  /**
   * Handles the event of PlayerStateChange from Youtube Player
   * @param data the new state emited by Youtube Player
   */
  onYoutubePlayerStateChange(data: any) {
    //if it is now Playing/Paused, update state
    if (data === 1 || data === 2) 
      this.newYtPlayerState()
    else if (data === 0 && this.hasNext &&
      (this.lastState === 2 || this.lastState === 1))//REQUIRED [lastState hack : youtube fails to buffer next video]
      this.next(); //video ended, play next 

    this.lastState = data;
  }

}

