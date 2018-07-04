import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { PlayableVM, PlayableSongVM, PlaylistBasicVM } from '../../models/api-view-models';
import { SongOptionsContext } from '../../models/internal-models';
import { PlayerService } from 'app/services/player.service';


@Component({
  selector: 'playable',
  templateUrl: './playable.component.html'
})
export class PlayableComponent {

  constructor(private playerService: PlayerService, private ref: ChangeDetectorRef) {

    //Subscribe to PlayerService state to know which song is playing
    playerService.onStateUpdate$.subscribe(x => {
      this.currentPlayableSongId =
        playerService.isPlayingSingleSong ? null : playerService.currentYtPlayerState.loadedSongId;
      ref.detectChanges(); //force view update
    })
  }

  //Defines which song is currently playing (null, if none)
  currentPlayableSongId: string = null;

  /**
   * Allows user to play any song in playable by clicking on it
   * @param index the index of the song in current playable
   */
  playSong(index: number) {
    this.playerService.playSongFromPlayableIndex(index);
  }

  /**
   * Instructs playerService to display options for a given song in playable
   * @param song Info about the song for which options should be displayed
   */
  showOptions(song: PlayableSongVM) {
    this.playerService.showPlayablesongOptions(song, true);
  }

  //Aux getter to get currently loaded playable from playerService and pass it to the view
  get playerServiceCurrentPlayable() {
    return this.playerService.currentPlayable;
  }

  //Aux getter to get if playerService is loading a new playable
  //from server, and inform theview
  get playerServiceWaitForServer() {
    return this.playerService.waitForServer;
  }


}





