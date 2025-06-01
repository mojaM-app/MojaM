import { User } from './../../dataBase/entities/users/user.entity';
import { IResetPasscodeEmailSettings } from './notifications/reset-passcode-email-settings.interface';
import { IUpdateUser } from './users/update-user.interfaces';

export interface IUserModuleBoundary {
  getIdByUuid(uuid: string | undefined): Promise<number | undefined>;
  getByUuid(uuid: string | undefined): Promise<User | null>;
  getById(userId: number | undefined): Promise<User | null>;
  findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<User[]>;
  updateAfterLogin(userId: number): Promise<void>;
  increaseFailedLoginAttempts(userId: number, failedAttempts: number): Promise<number>;
  lockOut(userId: number): Promise<User | null>;
  unlock(userId: number): Promise<User | null>;
  activate(userId: number): Promise<User | null>;
  deactivate(userId: number): Promise<User | null>;
  update(userId: number, model: IUpdateUser): Promise<User | null>;
  setPasscode(userId: number, passcode: string): Promise<void>;
}

export interface IPermissionModuleBoundary {
  getUserPermissions(user: any): Promise<number[]>;
}

export interface IAuthModuleBoundary {}

export interface INotificationModuleBoundary {
  sendEmailResetPasscode(settings: IResetPasscodeEmailSettings): Promise<boolean>;
}
