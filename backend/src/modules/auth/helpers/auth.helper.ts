import { AuthenticationTypes } from '../enums/authentication-type.enum';

export function getAuthenticationType(authData: { password?: string | null; pin?: string | null }): AuthenticationTypes | undefined {
  if ((authData.password?.length ?? 0) > 0) {
    return AuthenticationTypes.Password;
  } else if ((authData.pin?.length ?? 0) > 0) {
    return AuthenticationTypes.Pin;
  } else {
    return undefined;
  }
}
