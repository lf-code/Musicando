import { Component, Output, EventEmitter } from '@angular/core';

import { ApiAccountService } from 'app/api-module/api-account.service';
import { UserService } from 'app/services/user.service';


import { RegisterBM, LoginBM } from '../../../models/api-binding-models';
import { RegisterErrorVM } from "app/models/api-view-models";
import { StateSwitch } from 'app/models/internal-models';


@Component({
  selector: 'register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {

  constructor(private apiAccountService: ApiAccountService,
    private userService: UserService /*Required for REGEX*/) {

    //Reset binding model:
    this.registerData = new RegisterBM();
    this.registerData.username = "";
    this.registerData.email = "";
    this.registerData.password = "";
    this.registerData.confirmPassword = "";
  }

  //Binding model that holds the data to register the new user:
  registerData: RegisterBM = null;

  //Defines which errors occurred in the last attempt to register:
  registerError: RegisterErrorVM;

  //Helper: gets whether the password in the binding model matches its confirmation
  get passwordsMatch(): boolean { return this.registerData.password === this.registerData.confirmPassword }

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'register' functionality 
  showStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "success", "fail"], "form")

  
  /**
   * executes the request to register a new user using apiAccountService 
   */
  register() {
    this.showStateSwitch.changeState("wait");
    this.apiAccountService.register(this.registerData).subscribe(
      data => { this.registerSuccess(); },
      err => { this.registerFail(err); });
  }

  /**
   * Handles a successful response to the request to register a new user.
   */
  registerSuccess() {
    this.showStateSwitch.changeState("success");
    setTimeout(() => {
      let m = new LoginBM();
      m.username = this.registerData.username;
      m.password = this.registerData.password;
      this.userService.login(m);
    }, 1000);
  }

  /**
   * Handles an unsuccessful response to the request to
   * register a new user, displaying which errors occurred.
   * @param err
   */
  registerFail(err) {
    this.registerError = err.error;
    this.showStateSwitch.changeState("fail");
  }

  /**
   * Displays the 'register' form again.
   */
  backToForm() {
    this.registerError = null;
    this.showStateSwitch.changeState("form");
  }

  //Event: informs the parent component that the user has closed this menu
  @Output() onClose = new EventEmitter();

  /**
   * Emits the 'onClose' event.
   */
  close() {
    this.onClose.emit();
  }
}
