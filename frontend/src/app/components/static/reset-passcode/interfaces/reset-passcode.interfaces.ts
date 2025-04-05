import { AuthenticationTypes } from '../../activate-account/enums/authentication-type.enum';

export interface ICheckResetPasscodeTokenResultDto {
  isValid: boolean;
  userEmail?: string;
  authType?: AuthenticationTypes;
}
