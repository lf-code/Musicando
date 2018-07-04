import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PublicPlaylistBasicVM } from '../../models/api-view-models';
import { BrowseService } from 'app/services/browse.service';

@Component({
  selector: 'public-playlist',
  templateUrl: './public-playlist.component.html'
})
export class PublicPlaylistComponent {

  constructor(private browseService: BrowseService) { }

  //Info about the public playlist in this component:
  @Input() publicPlaylist : PublicPlaylistBasicVM;

  /**
   * Asks Browse service to play this public playlist
   */
  playPublicPlaylist() {
    this.browseService.playPublicPlaylist(this.publicPlaylist.publicPlaylistId);
  }

}





