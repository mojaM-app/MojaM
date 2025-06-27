import { type AuthenticationTypes } from '../../enums/authentication-types.enum';
import { type IHasGuidId } from '../IHasGuidId';
import { type IUser } from '../users/IUser';

export interface IEmailSettings {
  user: IUser & IHasGuidId;
  link: string;
}

export interface IResetPasscodeEmailSettings extends IEmailSettings {
  authType: AuthenticationTypes;
}

export interface IWelcomeEmailSettings extends IEmailSettings {}

export interface IUnlockAccountEmailSettings extends IEmailSettings {
  lockDateTime: Date;
}
