import { Component } from '@angular/core';
import { SearchResultVM } from 'app/models/api-view-models';
import { StateSwitch } from 'app/models/internal-models';
import { BrowseService } from 'app/services/browse.service';
import { ApiBrowseService } from 'app/api-module/api-browse.service';

@Component({
  selector: 'search',
  templateUrl: './search.component.html'
})
export class SearchComponent {

  constructor(
    private browseService: BrowseService,
    private apiBrowseService: ApiBrowseService) {

    //Allows browseService to inform that the component must be reset
    // (for instance, when user logs out)
    this.browseService.$onSearchReset.subscribe((x) => this.searchReset());
  }

  //Defines whether the search expression is meant to find Artists, Albums or Songs
  //Possible Values: "artist", "album", "song"
  searchType: string = "artist"; // artist, album, song

  //Array of results of a given search:
  results: SearchResultVM[] = null;

  //Expression to be searched for in the names of the artists, albums or songs:
  searchText: string = "";

  //View Helper - informs view of the state of component:
  // "form" - display form | "wait" - waiting for server |
  // "success" - succesfull response | "fail" - Error response
  searchStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form")

  //Whether a search expression is valid or not:
  get isValid(): boolean {
    return this.searchText !== undefined &&
      this.searchText !== null && this.searchText.length > 2
      && this.searchText.length < 50
  }


  /**
   * Uses ApiBrowseService to search for the searchExpression in the
   * name of the elements defined in searchType.
   */
  search() {
    // do not search if the expression is invalid:
    if (!this.isValid)
      return;

    console.log(`[Search Component]: search for "${this.searchText} in ${this.searchType}`);
    this.searchStateSwitch.changeState("wait");
    this.apiBrowseService.search(this.searchText, this.searchType).subscribe(
      data => { this.searchSuccess(data) },
      err => { this.searchFail(err); });
  }


  /**
   * Handles a successfull response to a search request to the server.
   * @param data data containing search results.
   */
  searchSuccess(data: SearchResultVM[]) {
    this.results = data;
    this.searchStateSwitch.changeState("success");
  }


  /**
   * Handles an error response to a search request to the server.
   * @param err error data
   */
  searchFail(err: any) {
    this.searchStateSwitch.changeState("fail");
    //display message, then change back to form:
    setTimeout(() => this.searchStateSwitch.changeState("form"), 2000);
  }


  /**
   * Resets the state of the component
   * @param keepType whether the search type must be kept or reset to default
   */
  searchReset(keepType: boolean = false) {
    this.searchText = "";
    if (!keepType)
      this.searchType = "artist";
    this.results = null;
    this.searchStateSwitch.changeState("form");
  }


  /**
   * Instructs BrowseService to display a given search result.
   * @param result the search result that must be shown.
   */
  searchGoTo(result: SearchResultVM) {
    this.browseService.goTo(result);
  }

}







