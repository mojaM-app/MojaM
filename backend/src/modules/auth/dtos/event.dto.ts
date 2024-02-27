import { IUser } from '@modules/users';

export class UserLoggedInEventDto {
  public readonly user: IUser;

  public constructor(user: IUser) {
    this.user = user;
  }
}

export class LockedUserTriesToLogInEventDto {
  public readonly user: IUser;

  public constructor(user: IUser) {
    this.user = user;
  }
}

export class InactiveUserTriesToLogInEventDto {
  public readonly user: IUser;

  public constructor(user: IUser) {
    this.user = user;
  }
}

export class FailedLoginAttemptEventDto {
  public readonly user: IUser;

  public constructor(user: IUser) {
    this.user = user;
  }
}

export class UserLockedOutEventDto {
  public readonly user: IUser;

  public constructor(user: IUser) {
    this.user = user;
  }
}
