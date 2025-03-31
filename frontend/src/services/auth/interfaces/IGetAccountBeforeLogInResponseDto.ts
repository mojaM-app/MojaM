import { AuthenticationTypes } from '../../../app/components/static/activate-account/enums/authentication-type.enum';

export interface IGetAccountBeforeLogInResponseDto {
  isPhoneRequired?: boolean;
  isActive?: boolean;
  authType?: AuthenticationTypes;
}
