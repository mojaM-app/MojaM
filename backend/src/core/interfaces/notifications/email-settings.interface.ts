// Export core notification interfaces without circular dependencies
import { AuthenticationTypes } from '@core/enums';
import { IHasGuidId } from '../IHasGuidId';
import { IUser } from '../users/IUser';

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
