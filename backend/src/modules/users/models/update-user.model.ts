import { TUpdateUser } from '../../../core/interfaces/users/update-user.interfaces';

export class UpdateUserModel {
  public readonly userId: number;
  public readonly userData: TUpdateUser;

  constructor(userId: number, userData: TUpdateUser) {
    this.userId = userId;
    this.userData = userData;
  }
}
