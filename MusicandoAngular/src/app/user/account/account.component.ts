import { Component, EventEmitter, Output } from '@angular/core';
import { LoginBM, RegisterBM } from 'app/models/api-binding-models';
import { RegisterErrorVM } from 'app/models/api-view-models';
import { StateSwitch } from 'app/models/internal-models';

@Component({
  selector: 'account',
  templateUrl: './account.component.html'
})
export class AccountComponent {

  //View Helper: defines wheter to display a 'login' or 'register' form.
  showStateSwitch: StateSwitch = new StateSwitch(["login", "register"], "login")

  /**
   * Displays 'login' form.
   */
  showLogin() {
    this.showStateSwitch.changeState("login");
  }

  /**
   * Displays 'register' form.
   */
  showRegister() {
    this.showStateSwitch.changeState("register");
  }

}
