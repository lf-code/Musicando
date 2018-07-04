import { Component, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { ArtistBasicVM, AlbumTrackVM, PlayableSongVM, AlbumBasicVM, SongBasicVM } from '../../models/api-view-models';
import { SongOptionsContext } from '../../models/internal-models';
import { SearchResultVM } from '../../models/api-view-models';
import { BrowseService } from 'app/services/browse.service';
import { ApiBrowseService } from 'app/api-module/api-browse.service';


@Component({
  selector: 'artist',
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.css']
})
export class ArtistComponent {

  constructor(private browseService: BrowseService,
    private apiBrowseService: ApiBrowseService,
    private el: ElementRef) {

    //When BrowseService wants to show something,
    //reset the view for this artist (close everything) and
    //if this is the component that matches what's to be shown, then show it.
    this.browseService.$onShow.subscribe(
      searchResult => {
        this.reset(false); 
        if (searchResult.artistId === this.artist.artistId) {
          this.show(searchResult);
        }
      }
    );

    //Reset view when instructed to do so by Browse service.
    this.browseService.$onArtistReset.subscribe(data => {
      this.reset(true);
    });

  }

  //View Helper: informs the view that the component is waiting for a response from the server.
  waitForServer = { loadingAlbumTracks: false }

  //the songid of the track to be highlighted when showing a search result (null, if none): 
  highlightedTrackId: string = null;

  /**
   * Resets the component and its view, deselecting everything. 
   * @param resetAlbumPage whether albumPage should also be reset to zero or not 
   */
  reset(resetAlbumPage: boolean) {
    this.highlightedTrackId = null;
    this.deselectAlbum();
    if (resetAlbumPage)
      this.changeAlbumPage(0);
  }


  // ----- SETUP AND OPERATION -----

  //The basic info about the artist in this component (with accessors)
  _artist: ArtistBasicVM = undefined;
  @Input()
  set artist(a: ArtistBasicVM) { //when setting the artist, do some setup operations:
    this._artist = a;

    //Define the number of album pages:
    this.totalAlbumsPages = Math.ceil(this.artist.albums.length / this.albumsPerPage);

    //(view helper - ngFor)
    for (let i = 0; i < this.totalAlbumsPages; i++)
      this.albumsPageArray.push(i);

    this.changeAlbumPage(0);

    //set background image:
    this.setCurrentStyles();
  }
  get artist(): ArtistBasicVM { return this._artist; }

  //Set background image corresponding to the image of the artist's first album:
  currentStyles: {};
  setCurrentStyles() {
    this.currentStyles = {
      'background-image': this.artist === undefined ||
          this.artist.albums[0] === undefined ? '' : 'url(' + this.artist.albums[0].imgLink + ')',
      'background-size': 'cover',
      'background-position': 'center'
    }
  }

  //Defines which album is currently selected (null if none):
  selectedAlbum: AlbumBasicVM = null;

  //Defines whether the list of tracks for the selected album should be shown:
  showTracksForSelectedAlbum: boolean = false;
  checkedAlbumTracksIds: string[] = [];

  //Defines how many albums should be in each album page (const):
  albumsPerPage: number = 3;
  
  //Defines how many album pages there are in total: 
  totalAlbumsPages: number = 0;

  //Defines the number of the page that is being displayed:
  albumsPage: number = 0;

  //Defines which albums are in the page that is being displayed:
  albumsInDisplay: AlbumBasicVM[] = [];

  //(view helper - ngFor)
  albumsPageArray: number[] = [];


  /**
   * Changes the album page.
   * @param targetPage the number of the target album page. 
   */
  changeAlbumPage(targetPage: number) {
    this.albumsPage = targetPage;
    //albums in display will be the respective slice of the array containing all albums: 
    this.albumsInDisplay = this.artist.albums.slice(targetPage * this.albumsPerPage,
      targetPage * this.albumsPerPage + this.albumsPerPage);
  }


  /**
   * Returns a promise that will be resolved when the tracks are available,
   * that is, when the info about the tracks is successfully loaded from the server,
   * or immediately if such info was loaded before.
   */
  setAlbumTracks() {

    return new Promise((resolve, reject) => {

      if (this.selectedAlbum.tracks === null) {
        //info about the tracks not available, load it from the server,
        //resolve this promise when the server responds (successfully)
        this.apiBrowseService.getAlbumTracks(this.selectedAlbum.albumId).subscribe(
          data => {
            this.selectedAlbum.tracks = data;
            //sort the tracks by their position in the album:
            this.selectedAlbum.tracks.sort((a, b) => a.position - b.position)
            resolve();
          },
          err => {
            reject();
          });
      }
      else //info about the tracks was loaded before, resolve immediately
        resolve();
    });
  }


  /**
   * Displays the list of tracks for the selected album,
   * optionally also highlighting a given track. 
   * @param highlightTrackId
   */
  showTracks(highlightTrackId: string = null) {

    //First wait for tracks to be set, then display them
    this.waitForServer.loadingAlbumTracks = true;
    this.setAlbumTracks().then(
      () => {
        this.waitForServer.loadingAlbumTracks = false;
        this.showTracksForSelectedAlbum = true; // display the list
        this.highlightedTrackId = highlightTrackId; //highlight the track, if any
      }
    );

  }


  /**
   * Hides the list of album tracks currently being displayed.
   */
  hideTracks() {
    this.showTracksForSelectedAlbum = false;
    this.checkedAlbumTracksIds = []; //uncheck all tracks
  }


  /**
   * Handles the event of an album being selected (clicked).
   * @param albumId the albumId of the selected album
   */
  selectAlbum(albumId: string) {

    //If the album is currently selected, then deselect it.
    if (this.selectedAlbum !== null && albumId === this.selectedAlbum.albumId)
      this.deselectAlbum();
    else {
      //Before selecting the album, all selected albums in all artists must be deselected!
      //Communicate that to all artist components, using BrowseService that already
      //implements such functionality for showing searchResults.
      //(simply create a searchResult object to show the selected album)
      let s = new SearchResultVM();
      s.artistId = this.artist.artistId;
      s.albumId = albumId;
      s.songId = null;
      this.browseService.show(s);
    }
  }


  /**
   * Deselects an album and hides its list of tracks.
   */
  deselectAlbum() {
    this.hideTracks(); 
    this.selectedAlbum = null;
  }


  /**
   * Scrolls view to this component, opens the album and highlights the song
   * in search result (if any).
   * @param searchResult
   */
  show(searchResult: SearchResultVM) {

    //if the search result includes an album, show its tracks:
    if (searchResult.albumId != undefined && searchResult.albumId != null) {
      this.selectedAlbum = this.artist.albums.find((v) => v.albumId === searchResult.albumId);

      //if the search result includes a track, highlight it:
      if (searchResult.songId != undefined && searchResult.songId != null)
        this.showTracks(searchResult.songId);
      else
        this.showTracks();
    }
    this.showMoveTo();
  }


  /**
   * Aux method that scrolls the view to show this component
   */
  showMoveTo() {
    setTimeout(() => this.el.nativeElement.scrollIntoView(
      { behavior: "smooth", block: "start", inline: "nearest" }
    ), 500); //delay for animation purposes
  }


  /**
   * Handles the event of an album track being checked/unchecked.
   * @param checked whether the track was checked or unchecked
   * @param songId songId of the track
   */
  albumTrackCheckedChanged(checked: boolean, songId: string) {
    if (checked)
      this.checkedAlbumTracksIds.push(songId);
    else {
      let index = this.checkedAlbumTracksIds.indexOf(songId);
      if (index >= 0)
        this.checkedAlbumTracksIds.splice(index, 1);
    }

  }


  /**
   * Builds a SongOptionsContext object with the information about the tracks that
   * are currently checked and uses browseService to ask user component to display the options for those tracks
   * namely, the option to add them to some user playlist.
   */
  showSongOptions() {

    if (this.checkedAlbumTracksIds === null || this.checkedAlbumTracksIds.length === 0)
      return;

    let songOptionsContext: SongOptionsContext = new SongOptionsContext();
    songOptionsContext.songs = [];
    for (let id of this.checkedAlbumTracksIds) {
      let track = this.selectedAlbum.tracks.find(t => t.songId === id)
      let aux = new SongBasicVM();
      aux.songId = track.songId;
      aux.name = track.name;
      aux.artistName = this.artist.name;
      aux.albumName = this.selectedAlbum.name;
      songOptionsContext.songs.push(aux);
    }

    this.browseService.showPlayablesongOptions(songOptionsContext);
  }


  // ----- PLAY -----

  /**
   * Asks BrowseService to play a given album track. 
   * @param songId SongId of the track to be played.
   */
  playAlbumSong(songId: string) {
    this.browseService.playAlbumSong(songId);
  }


  /**
   * Asks BrowseService to play a given album.
   * @param albumId the albumId of the album to be played.
   */
  playAlbum(albumId: string) {
    console.log("play album pid: " + albumId)
    this.browseService.playAlbum(albumId);
  }


  /**
   * Asks BrowseService to play the playlist containing
   * the hits for this artist
   */
  playArtistHitsPlaylist() {
    this.browseService.playPublicPlaylist(this.artist.hitsPlaylistId);
  }

}
