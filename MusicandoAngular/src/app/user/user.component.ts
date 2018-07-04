import { Component, ComponentFactoryResolver, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthuserhostDirective } from './authuser/authuserhost.directive';
import { AuthuserComponent } from './authuser/authuser.component';
import { UserService } from "app/services/user.service";
import { UserBasicVM } from 'app/models/api-view-models';


@Component({
  selector: 'user',
  templateUrl: './user.component.html'
})
export class UserComponent {

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private userService: UserService) {
    //Subscribes login/logout events from user service:
    this.userService.onUserAuthenticated$.subscribe((data) => this.authenticate(data));
    this.userService.onUserLogout$.subscribe(() => this.logout());
  }

  //Represents whether an user is authenticated
  isAuthenticated: boolean = false;

  //Represents a reference to the AuthUser component
  authUserComponment: any = null;

  //Defines the directive that will host the AuthUser component
  @ViewChild(AuthuserhostDirective) myhost: AuthuserhostDirective;

  /**
   * Injects 'AuthUser' component when an user logs in successfully.
   * @param user Basic info about the user that has logged in.
   */
  authenticate(user: UserBasicVM) {
    this.isAuthenticated = true;
    //inject authuser component into myhost directive
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(AuthuserComponent);
    let viewContainerRef = this.myhost.viewContainerRef;
    viewContainerRef.clear();
    let componentRef = viewContainerRef.createComponent(componentFactory);
    this.authUserComponment = (<AuthuserComponent>componentRef.instance);
    this.authUserComponment.setUser(user);
  }

  //
  /**
   * On sucessful logout, destroys authuser component (clears out all user data first)
   */
  logout() {
    this.myhost.viewContainerRef.clear();
    this.isAuthenticated = false;
  }
}
