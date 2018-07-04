import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiAccountService } from 'app/api-module/api-account.service';
import { ApiBrowseService } from 'app/api-module/api-browse.service';
import { ApiPlayableService } from 'app/api-module/api-playable.service';
import { ApiPlaylistsService } from 'app/api-module/api-playlists.service';
import { ApiPrivatesongsService } from 'app/api-module/api-privatesongs.service';

import { MyInterceptor } from './http-interceptor/my-interceptor';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
    ],
    declarations: [],
    providers: [ApiAccountService, ApiBrowseService, ApiPlayableService,
        ApiPlaylistsService, ApiPrivatesongsService
        //,{ provide: HTTP_INTERCEPTORS, useClass: MyInterceptor, multi: true } // IF PRODUCTION, COMMENT TO EXCLUDE HTTP INTERCEPTOR!
    ]
})
export class ApiModule { }
