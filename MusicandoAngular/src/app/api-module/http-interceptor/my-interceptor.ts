import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class MyInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    //CHANGES LOCALHOST TO SEND REQUEST TO DEVELOPMENT API 
    const newReq = req.clone({
      url: "http://localhost:3722" + req.url //TURN-OFF ON PRODUCTION (ON api-module.ts (api-module folder), comment provider!)
    });

    return next.handle(newReq);
  }

}
