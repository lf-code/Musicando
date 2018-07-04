import { Component, EventEmitter, Output, Input } from '@angular/core';
import { UserBasicVM } from "app/models/api-view-models";
import { StateSwitch } from 'app/models/internal-models';

@Component({
  selector: 'account-options',
  templateUrl: './account-options.component.html'
})
export class AccountOptionsComponent {

  @Input() user: UserBasicVM = null;

  //View Helper: Defines which options menu to display
  showStateSwitch: StateSwitch = new StateSwitch(["options", "change", "delete"], "options")

  /**
   * Displays the menu with the options available
   * @param logout Whether user is logging out due to having deleted his account
   */
  showOptions(logout: boolean) {
    if (logout)
      this.close(true);
    this.showStateSwitch.changeState("options");
  }

  /**
   * Displays the 'Change' Menu that allows the user to change its password
   */
  showChange() {
    this.showStateSwitch.changeState("change");
  }

  /**
   * Displays the 'Delete' menu that allows the user to delete its account
   */
  showDelete() {
    this.showStateSwitch.changeState("delete");
  }

  //Event: informs the parent component that user closed 'options' menu
  @Output() onClose = new EventEmitter();

  /**
   * Emits 'onClose' event when user closes 'options' menu,
   * with the additional info about whether the user should be logged out.
   * @param logout Whether user should be logged out because he deleted his account.
   */
  close(logout: boolean = false) { this.onClose.emit(logout); }

}
