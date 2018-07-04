import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements AfterViewInit {

  constructor() {}

  /**
   * After initializing the view, dispatch event to load
   * the IFrame Player API (in script tag in index.html)
   */
  ngAfterViewInit() {
    window.dispatchEvent(window["onDownloadYoutubeScript"]);
  }

}
