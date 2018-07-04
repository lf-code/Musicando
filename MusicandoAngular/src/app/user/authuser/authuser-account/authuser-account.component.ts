import { Component, EventEmitter, Input } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { ApiAccountService } from 'app/api-module/api-account.service';
import { ChangePasswordBM, LoginBM } from "app/models/api-binding-models";
import { UserBasicVM } from "app/models/api-view-models";
import { StateSwitch } from 'app/models/internal-models';


@Component({
  selector: 'authuser-account',
  templateUrl: './authuser-account.component.html'
})
export class AuthuserAccountComponent {

  constructor(private userService: UserService) { }

  //Basic info (username) about authenticated user
  @Input() user: UserBasicVM = null;

  //View Helper: defines which menu to display in the view
  showStateSwitch: StateSwitch = new StateSwitch(["actions", "options", "logoutWait"], "actions")

  /**
   * Displays the 'Options' menu, with the options available to
   * an authenticated user so he can manage his account
   */
  showOptions() {
    this.showStateSwitch.changeState("options");
  }

  /**
   * Allows an authenticated user to log out
   */
  logout() {
    this.showStateSwitch.changeState("logoutWait");
    this.userService.logout();
  }

  /**
   * Closes 'Options' menu, displaying again the 'Actions' menu.
   * @param logout Whether 'options' was closed by logging out.
   */
  onOptionsClose(logout: boolean = false) {
    this.showStateSwitch.changeState("actions");
    if (logout)
      this.logout();
  }
}
