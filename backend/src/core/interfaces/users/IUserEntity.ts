import { IHasGuidId } from '../IHasGuidId';
import { IUser } from './IUser';
import { IUserId } from './IUser.Id';

export interface IUserEntity extends IUser, IUserId, IHasGuidId {
  uuid: string;
  passcode: string | null;
  isActive: boolean;
  isLockedOut: boolean;
  failedLoginAttempts: number;
  joiningDate: Date | null;
  salt: string;
  refreshTokenKey: string;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  isPasscodeSet: () => boolean;
}
