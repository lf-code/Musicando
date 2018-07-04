import { Directive, ViewContainerRef, Input } from '@angular/core';

@Directive({
  selector: '[authuserhost]',
})
export class AuthuserhostDirective {

  constructor(public viewContainerRef: ViewContainerRef) {}
}
