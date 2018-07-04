import { BrowserModule } from '@angular/platform-browser';
import { NgModule} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

//Import my api module:
import { ApiModule } from './api-module/api.module';

//IMPORT COMPONENTS, DIRECTIVES AND SERVICES:

import { AppComponent } from './app.component';

//USER:
import { UserComponent } from './user/user.component';
import { AccountComponent } from './user/account/account.component';
import { LoginComponent } from './user/account/login/login.component';
import { RegisterComponent } from './user/account/register/register.component';

import { AuthuserComponent } from './user/authuser/authuser.component';
import { AuthuserAccountComponent } from './user/authuser/authuser-account/authuser-account.component';
import { AccountOptionsComponent } from './user/authuser/authuser-account/account-options/account-options.component';
import { AccountChangeComponent } from './user/authuser/authuser-account/account-options/change/account-change.component';
import { AccountDeleteComponent } from './user/authuser/authuser-account/account-options/delete/account-delete.component';

import { AuthuserhostDirective } from './user/authuser/authuserhost.directive';

import { PlayablesongOptionsComponent } from './user/authuser/playablesong-options/playablesong-options.component';

import { PrivateSongsComponent } from './user/authuser/privatesongs/privatesongs.component';
import { PrivateSongsNewComponent } from './user/authuser/privatesongs/new/privatesongs-new.component';
import { PrivateSongsOptionsComponent } from './user/authuser/privatesongs/options/privatesongs-options.component';

import { PlaylistsComponent } from './user/authuser/playlists/playlists.component';
import { PlaylistsNewComponent } from './user/authuser/playlists/new/playlists-new.component';
import { PlaylistsOptionsComponent } from './user/authuser/playlists/options/playlists-options.component';

//BROWSE:
import { BrowseComponent } from './browse/browse.component';
import { ArtistComponent } from './browse/artist/artist.component';
import { PublicPlaylistComponent } from './browse/public-playlist/public-playlist.component';
import { SearchComponent } from './browse/search/search.component';

//PLAYER:
import { PlayerComponent } from './player/player.component';
import { YtPlayerComponent } from './player/yt-player/yt-player.component';
import { PlayableComponent } from './player/playable/playable.component';

//SERVICES:
import { UserService } from './services/user.service';
import { BrowseService } from './services/browse.service';
import { PlayerService } from './services/player.service';


@NgModule({
    declarations: [
      AppComponent,
      UserComponent,
      AccountComponent,
      LoginComponent,
      RegisterComponent,
      AuthuserComponent,
      AuthuserAccountComponent,
      AccountOptionsComponent,
      AccountChangeComponent,
      AccountDeleteComponent, 
      AuthuserhostDirective,
      PlayablesongOptionsComponent,
      PrivateSongsComponent,
      PrivateSongsNewComponent,
      PrivateSongsOptionsComponent,
      PlaylistsComponent,
      PlaylistsNewComponent,
      PlaylistsOptionsComponent,
      BrowseComponent,
      SearchComponent,
      ArtistComponent,
      PublicPlaylistComponent,
      YtPlayerComponent,
      PlayableComponent,
      PlayerComponent
  ],
  imports: [
      BrowserModule,
      FormsModule,
      ApiModule //INCLUDES INTERCEPTOR!
    ],
  providers: [UserService, BrowseService, PlayerService],
  bootstrap: [AppComponent],
  entryComponents: [AuthuserComponent]
})
export class AppModule {
}

