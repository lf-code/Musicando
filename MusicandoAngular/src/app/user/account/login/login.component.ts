import { Component, Output, EventEmitter } from '@angular/core';
import { ApiAccountService } from "app/api-module/api-account.service";
import { UserService } from "app/services/user.service";
import { LoginBM } from '../../../models/api-binding-models';
import { StateSwitch } from 'app/models/internal-models';

@Component({
  selector: 'login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  constructor(private userService: UserService) {
    //resets the binding model:
    this.loginData = new LoginBM();
  }

  //Binding model that holds the credentials for login.
  loginData: LoginBM = null;

  //View Helper: defines what to display depending on
  //the state of the form that implements the 'login' functionality 
  loginStateSwitch: StateSwitch = new StateSwitch(["form", "wait", "fail"], "form")

  /**
   * Executes the request to login using userService.
   */
  login() {
    //successfull responses will be tapped by the user service, that will
    //be in charge to inject the respective authuser component.
    this.loginStateSwitch.changeState("wait");
    this.userService.login(this.loginData)
      .then(() => console.log("[Login Component]: Successful login."))
      .catch((err) => {
        this.loginStateSwitch.changeState("fail");
      });
  }

  /**
   * Displays the 'login' form again.
   */
  backToForm() {
    this.loginStateSwitch.changeState("form");
  }

  //Event: informs parent component to display the 'register' form.
  @Output() onGoToRegister = new EventEmitter();

  /**
   * Emits the 'onGoToRegister' event.
   */
  goToRegister() {
    this.onGoToRegister.emit();
  }
}
