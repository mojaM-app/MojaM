import { TUpdateUser } from '../interfaces/update-user.interfaces';

export class UpdateUserModel {
  public readonly userId: number;
  public readonly userData: TUpdateUser;

  constructor(userId: number, userData: TUpdateUser) {
    this.userId = userId;
    this.userData = userData;
  }
}
