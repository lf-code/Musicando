import { Component, EventEmitter, Output } from '@angular/core';

import { ChangePasswordBM } from "app/models/api-binding-models";
import { ApiAccountService } from 'app/api-module/api-account.service';
import { UserService } from 'app/services/user.service';
import { StateSwitch } from 'app/models/internal-models';

@Component({
  selector: 'account-change',
  templateUrl: './account-change.component.html'
})
export class AccountChangeComponent {

  constructor(
    private apiAccountService: ApiAccountService,
    private userService: UserService /*REGEX for password*/) {
    this.changePasswordModel = new ChangePasswordBM();
  }

  //The binding model used to change the password, that should contain
  // the old password, the new password and its confirmation.
  changePasswordModel: ChangePasswordBM;

  //Determines whether new password and its confirmation actually match.
  get passwordsMatch(): boolean {
    return this.changePasswordModel.newPassword === this.changePasswordModel.confirmNewPassword
  }

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'change password' functionality 
  showStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form")

  /**
   * Displays the form in its initial state.
   */
  showForm() {
    this.changePasswordModel = new ChangePasswordBM();
    this.showStateSwitch.changeState("form");
  }

  /**
   * Executes the request to change the password, using the ApiAccountService.
   */
  changePassword() {
    this.showStateSwitch.changeState("wait");
    this.apiAccountService.changePassword(this.changePasswordModel).subscribe(
      data => { this.changePasswordSuccess(); },
      err => { this.changePasswordFail(); });
  }

  /**
   * Handles a successfull response to the request to change the password
   */
  changePasswordSuccess() {
    this.showStateSwitch.changeState("success");
    setTimeout(() => { this.close() }, 1000)
  }

  /**
   * Handles an unsuccessful response to the request to change the password
   */
  changePasswordFail() {
    this.showStateSwitch.changeState("fail");
  }

  //Event: Informs the parent component that this menu should be closed
  @Output() onClose = new EventEmitter();

  /**
   * Emits the 'onClose' event (also states that user should not log out,
   * given that the parent component handler requires this info)
   */
  close() { this.onClose.emit(false); }

}
