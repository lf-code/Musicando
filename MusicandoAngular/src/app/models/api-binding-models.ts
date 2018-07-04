//Binding model for user register data
export class RegisterBM {
  public email: string;
  public username: string;
  public password: string;
  public confirmPassword: string;
}

//Binding model for user login data
export class LoginBM {
  public username: string;
  public password: string;
}

//Binding model for changing user's account password
export class ChangePasswordBM {
  public currentPassword: string;
  public newPassword: string;
  public confirmNewPassword: string;
}

//Binding model for setting a song position in a playable
export class PlayableSongBM {
  public songId: string;
  public position: number;
}

//Binding model for the data to create a private song 
export class PrivateSongBM {
  public videoUrl: string; // Max-Lenght: 15;
  public name: string; // Max-Lenght: 30;
  public artistName: string; //  Max-Lenght: 30;
  public albumName: string; // Max-Lenght: 30;
  public startAt: string; //"0[0-9]:[0-5][0-9]:[0-5][0-9]"
  public endAt: string; //"0[0-9]:[0-5][0-9]:[0-5][0-9]"
}
