import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiAccountService } from 'app/api-module/api-account.service';
import { UserService } from 'app/services/user.service';
import { LoginBM } from "app/models/api-binding-models";
import { UserBasicVM } from "app/models/api-view-models";
import { StateSwitch } from 'app/models/internal-models';


@Component({
  selector: 'account-delete',
  templateUrl: './account-delete.component.html'
})
export class AccountDeleteComponent {

  constructor(private apiAccountService: ApiAccountService,
    private userService: UserService /*REGEX for password*/) {
    this.deleteAccountLoginModel = new LoginBM();
  }

  //Basic info about the authenticated user
  @Input() user: UserBasicVM = null;

  //The binding model that holds the user's credentials to delete the account.
  deleteAccountLoginModel: LoginBM;

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'delete account' functionality 
  showStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form")

  /**
   * Displays the form in its initial state.
   */
  showForm() {
    this.showStateSwitch.changeState("form");
  }

  /**
   * Executes the request to delete the account, through the ApiAccountService.
   */
  deleteAccount() {
    this.deleteAccountLoginModel.username = this.user.username;
    this.showStateSwitch.changeState("wait");
    this.apiAccountService.deleteAccount(this.deleteAccountLoginModel).subscribe(
      data => { this.deleteSuccess(); },
      err => { this.deleteFail(); });
  }

  /**
   * Handles a successfull response to the request to delete the account
   */
  deleteSuccess() {
    this.showStateSwitch.changeState("success");
    setTimeout(() => { this.close(true) }, 500)
  }

  /**
   * Handles an unsuccessful response to the request to delete the account
   */
  deleteFail() {
    this.showStateSwitch.changeState("fail");
  }

  //Event: Informs the parent component that this menu should be closed
  @Output() onClose = new EventEmitter();

    /**
   * Emits the 'onClose' event informing the parent component whether the user
   * should be logged out ( in case of having deleted his account)
   */
  close(logout: boolean = false) {
    this.onClose.emit(logout);
  }

}
