import { type IHasGuidId } from '../IHasGuidId';
import { type IUser } from './IUser';
import { type IUserId } from './IUser.Id';

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
