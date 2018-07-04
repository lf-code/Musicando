import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { ApiPrivatesongsService } from 'app/api-module/api-privatesongs.service';
import { PrivateSongBasicVM } from "app/models/api-view-models";
import { PrivateSongBM } from "app/models/api-binding-models";
import { StateSwitch } from "app/models/internal-models";


@Component({
  selector: 'privatesongs-new',
  templateUrl: './privatesongs-new.component.html'
})
export class PrivateSongsNewComponent {

  constructor(private apiPrivatesongsService: ApiPrivatesongsService) { }

  //View Helper: defines if close button should be enabled
  get allowClose(): boolean { return this.createStateSwitch.currentState === "form" }

  //Represents the youtube url of the video from which the new private song will be created
  youtubeUrl: string = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  //Determines if the video and its menu should be displayed
  //(true if user has entered a valid url that has been loaded successfully)
  showVideo: boolean = false;

  //The binding model for the creation of the new private song
  newPrivateSong: PrivateSongBM;

  //Defines the basic info about the loaded youtube video (id, title, duration)
  loadedVideo: any;

  /**
   * Resets 'newPrivateSong' binding model
   */
  resetNewPrivateSong() {
    this.newPrivateSong = new PrivateSongBM();
    this.newPrivateSong.name = "";
    this.newPrivateSong.artistName = "";
    this.newPrivateSong.albumName = "";
    this.newPrivateSong.videoUrl = "";
    this.newPrivateSong.startAt = "00:00:00";
    this.newPrivateSong.endAt = "00:00:01";
  }


  /**
   * Resets the info about the loaded video.
   */
  resetVideo() {
    this.loadedVideo = { id: null, title: "Sem título", duration: 0 }
  };

  //Auxiliary: determines if this component has been closed
  //(window["playerps"] == undefined does not work everytime)
  isClosed: boolean = false;

  /**
   * When this component initializes, resets binding model,
   * and creates a secondary youtube player.
   */
  ngOnInit(): void {
    this.resetVideo();
    this.resetNewPrivateSong();
    window["newYoutubePlayer"]();
    window["playerps"].addEventListener("onStateChange", (x) => this.onStateChanged(Number(x.data)));
  }

  /**
   * When this component is destroyed, discards the secondary youtube player.
   */
  ngOnDestroy(): void {
    window["playerps"] = undefined;
  }

  /**
   * Loads the video into the secondary youtube player, if the video url is valid.
   */
  loadVideo() {
    let id = this.getVideoUrl();
    if (id != null)
      window["playerps"].cueVideoById(id);
  }

  /**
   * Aux method that extracts video id from youtube url,
   * if the url is valid (returns null otherwise)
   */
  getVideoUrl() {
    let exp = "watch?v=";
    let i = this.youtubeUrl.indexOf(exp)
    if (i >= 0) {
      let id = this.youtubeUrl.substring(i + exp.length)
      return id;
    }
    return null;
  }

  /**
   * Handles the 'onStateChangedEvents' of the secondary youtube player
   * @param state the new state
   */
  onStateChanged(state: number) {

    //the component was destroyed in the meanwhile, do nothing:
    if (window["playerps"] == undefined || this.isClosed)
      return;

    // a new video cued:
    if (state === 5) {
      //reset model info
      this.resetVideo();
      this.resetNewPrivateSong();

      //play initially for a bit, on mute, so it loads info.
      window["playerps"].mute();
      window["playerps"].playVideo();
    }

    // the video is now  playing:
    if (state === 1) {

      //playing for the first time, info has not yet been loaded (id has not set)
      if (this.loadedVideo.id === null) {

        //let it play for one second, so video info has time to load.
        setTimeout(() => {

          //while it was playing for a second, component was closed. Do nothing and return.
          if (window["playerps"] == undefined || this.isClosed)
            return;

          //obtain the video data from the secondary player, and store it in loaded video:
          let data = window["playerps"].getVideoData();
          this.loadedVideo.title = data.title;
          this.loadedVideo.id = data.video_id;
          this.loadedVideo.duration = window["playerps"].getDuration();
          this.newPrivateSong.endAt = this.getDurationFromTotalSeconds(this.loadedVideo.duration);
          this.youtubeWasLoadedWithSuccess = true;

          //pause video, information has been loaded.
          //(user can then choose to play it again)
          window["playerps"].pauseVideo();

        }, 1000)

      }
      else {
        //user requested it to play.
        //unmute it and pause the main youtube player
        //(only one player should be playing at a time)
        window["playerps"].unMute();
        window["player"].pauseVideo();
      }
    }
  }

  // ----- GET CURRENT TIME -----

  /**
   * Pauses the video in secondary youtube player
   * and returns the current time of the video
   */
  getTimeFromVideo() {
    window["playerps"].pauseVideo();
    let time = window["playerps"].getCurrentTime();
    return this.getDurationFromTotalSeconds(time);
  }

  /**
   * Sets the video of the new private song to start at
   * the current playing time of the playing video in the secondary player.
   */
  getStartTimeFromVideo() {
    this.newPrivateSong.startAt = this.getTimeFromVideo();
  }

  /**
  * Sets the video of the new private song to end at
  * the current playing time of the playing video in the secondary player.
  */
  getEndTimeFromVideo() {
    this.newPrivateSong.endAt = this.getTimeFromVideo();
  }

  /**
   * Gets the duration, as a time string "00:00:00", from a total number of seconds
   * @param durationInTotalSeconds duration as a total number of seconds
   */
  public getDurationFromTotalSeconds(durationInTotalSeconds: number) {
    durationInTotalSeconds = Math.floor(durationInTotalSeconds);
    let durationTime = { hours: 0, minutes: 0, seconds: 0 };
    durationTime.seconds = durationInTotalSeconds % 60;
    durationInTotalSeconds = durationInTotalSeconds - durationTime.seconds;
    durationTime.minutes = (durationInTotalSeconds % 3600) / 60;
    durationInTotalSeconds = durationInTotalSeconds - durationTime.minutes;
    durationTime.hours = Math.round(durationInTotalSeconds / 3600);
    let durationString = (durationTime.hours > 9 ? "" : "0") + durationTime.hours.toString() + ":";
    durationString += (durationTime.minutes > 9 ? "" : "0") + durationTime.minutes.toString() + ":";
    durationString += (durationTime.seconds > 9 ? "" : "0") + durationTime.seconds.toString();
    return durationString
  }

  // ----- LOAD FROM YOUTUBE -----

  //Determines if youtube video and its information have been loaded successfully
  youtubeWasLoadedWithSuccess: boolean = false;

  //View Helper: defines what to display depending on the state of the
  //form that allows user to insert a youtube url of a video to be loaded
  loadYoutubeStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form");

  /**
   * Executes the request to load a video based on the url provided by the user
   */
  loadYoutube() {
    //1) hide current video, if any
    this.showVideo = false;
    this.youtubeWasLoadedWithSuccess = false;
    this.loadYoutubeStateSwitch.changeState("wait");

    //2) wait 5 seconds for the video to load
      this.loadVideo();
      setTimeout(() => {
        if (this.youtubeWasLoadedWithSuccess)
          this.loadYoutubeFormSuccess();
        else 
          this.loadYoutubeFormFail(); 
      }, 5000);
  }

  /**
   * Handles the case where youtube video was successfully loaded 
   */
  loadYoutubeFormSuccess() {
    this.loadYoutubeStateSwitch.changeState("form");
    this.showVideo = true;
  }

  /**
   * Handles the case where youtube video has not been loaded within the time limit.
   */
  loadYoutubeFormFail() {
    console.log("[PrivateSongNew Component]: [ERROR] Youtube video didn't load within 5 secs.")
    this.loadYoutubeStateSwitch.changeState("fail");
    setTimeout(() => this.loadYoutubeStateSwitch.changeState("form"), 1500);
  }


  // ----- CREATE -----

  //View Helper: defines what to display depending on the state of
  //the form that implements the 'create new private song' functionality 
  createStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form");

  /**
   * Executes the request to create a new private song,
   * using the apiPrivatesongsService
   */
  createPrivateSong() {
    this.newPrivateSong.videoUrl = this.getVideoUrl();
    this.createStateSwitch.changeState("wait");
    this.apiPrivatesongsService.create(this.newPrivateSong).subscribe(
      data => this.createFormSuccess(data),
      err => this.createFormFail());
  }

  /**
   * Handles a successfull response to the request to create a new private song
   * @param dataResponse Basic information about the new private song that was created
   */
  createFormSuccess(dataResponse) {
    this.createStateSwitch.changeState("success");
    setTimeout(() => this.close(dataResponse), 1500);
  }

  /**
   * Handles an unsuccessfull response to the request to create a new private song
   */
  createFormFail() {
    this.createStateSwitch.changeState("fail");
    setTimeout( () => this.createStateSwitch.changeState("form"), 1500);
  }


  //Event: informs the parent component that the user has closed this menu
  @Output() onClose = new EventEmitter<PrivateSongBasicVM>();

  /**
   * Emits the event 'onClose', optionally passing to the parent component
   * the information about the private song just created (if any)
   * @param privateSongJsutCreated 
   */
  close(privateSongJsutCreated: PrivateSongBasicVM = null) {
    //Hack to avoid errors with future events/timeouts/promises
    //that resolve after this component is closed:
    window["playerps"] = undefined; 
    this.isClosed = true;

    this.onClose.emit(privateSongJsutCreated );
  }
}
