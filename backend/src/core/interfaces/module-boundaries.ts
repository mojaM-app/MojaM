import { IResetPasscodeEmailSettings } from './notifications/email-settings.interface';
import { IUserEntity } from './users/IUserEntity';
import { IUpdateUser } from './users/update-user.interfaces';

export interface IUserModuleBoundary {
  getIdByUuid(uuid: string | undefined): Promise<number | undefined>;
  getByUuid(uuid: string | undefined): Promise<IUserEntity | null>;
  getById(userId: number | undefined): Promise<IUserEntity | null>;
  findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<IUserEntity[]>;
  updateAfterLogin(userId: number): Promise<void>;
  increaseFailedLoginAttempts(userId: number, failedAttempts: number): Promise<number>;
  lockOut(userId: number): Promise<IUserEntity | null>;
  unlock(userId: number): Promise<IUserEntity | null>;
  activate(userId: number): Promise<IUserEntity | null>;
  deactivate(userId: number): Promise<IUserEntity | null>;
  update(userId: number, model: IUpdateUser): Promise<IUserEntity | null>;
  setPasscode(userId: number, passcode: string): Promise<void>;
}

export interface IPermissionModuleBoundary {
  getUserPermissions(user: any): Promise<number[]>;
}

export interface IAuthModuleBoundary {}

export interface INotificationModuleBoundary {
  sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean>;
}
