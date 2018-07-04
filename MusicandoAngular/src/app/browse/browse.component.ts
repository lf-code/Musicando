import { Component } from '@angular/core';
import { PublicPlaylistBasicVM, ArtistBasicVM, SongBasicVM } from '../models/api-view-models';
import { BrowseService } from 'app/services/browse.service';
import { ApiBrowseService } from 'app/api-module/api-browse.service';
import { finalize } from 'rxjs/operators/finalize';

@Component({
  selector: 'browse',
  templateUrl: './browse.component.html'
})
export class BrowseComponent {

  constructor(private browseService: BrowseService,
    private apiBrowseService: ApiBrowseService) {

    // 1) get artist info from server:
    this.apiBrowseService.getArtists()
      .pipe(finalize(() => this.waitForServer.loadingArtists = false))
      .subscribe(data => {
      this.artists = data;
    }, err => {
      console.log("[Browse Component]: [ERROR] No artist info was loaded.");
    });

    // 2) get public playlist info from server:
    this.apiBrowseService.getPlaylists()
      .pipe(finalize(() => this.waitForServer.loadingPublicPlaylists = false))
      .subscribe(data => {
      this.publicPlaylists = data;
    }, err => {
      console.log("[Browse Component]: [ERROR] No public playlist info was loaded.");
    })

    // 3) Subscribe to $onBrowseGoTo to change navTab to 'artist',
    //    when BrowseService wants to show a search result.
    this.browseService.$onBrowseGoTo.subscribe(data => {
      this.currentNav = 1;
      //wait a little for the view to update before informing
      // Browse service that navTab was changed:
      setTimeout(() => this.browseService.show(data), 200);
    });

  }

  //Basic info about all the artists to be displayed in browse: 
  artists: ArtistBasicVM[];

  //Basic info about all the public playlists to be displayed in browse:
  publicPlaylists: PublicPlaylistBasicVM[];

  //View Helper: informs view that the component is waiting for an response from the server
  waitForServer = { loadingArtists: true, loadingPublicPlaylists: true, loadingSongs: true }

  //Possible NavTab Values: artists = 1 | playlists = 2 | search = 3
  currentNav: number = 1;

  /**
   * Changes the navTab.
   * @param targetNav target navTab code (artists = 1 | playlists = 2 | search = 3)
   */
  changeNav(targetNav: number) {

    //Whenever 'artists' navTab is exited, reset the view in all artists.
    //(use browse service to communicate with all artist components)
    if (this.currentNav === 1 && targetNav !== 1)
      this.browseService.artistReset();

    this.currentNav = targetNav;
  }

}
