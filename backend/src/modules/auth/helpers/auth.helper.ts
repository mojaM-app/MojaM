import { AuthenticationTypes } from '@core';
import { isNullOrEmptyString } from '@utils';
import { PasswordService } from '../services/password.service';
import { PinService } from '../services/pin.service';

export function getAuthenticationType({
  passcode,
}: {
  passcode: string | null | undefined;
}): AuthenticationTypes | undefined {
  if (isNullOrEmptyString(passcode)) {
    return undefined;
  }

  if (passcode!.length === PinService.HASH_LENGTH) {
    return AuthenticationTypes.Pin;
  } else if (passcode!.length === PasswordService.HASH_LENGTH) {
    return AuthenticationTypes.Password;
  }
  return undefined;
}
