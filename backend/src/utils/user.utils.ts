import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_UUID } from '../config/index';

export const getAdminLoginData = (): {
  uuid: string;
  email: string;
  phone: string;
  passcode: string;
  salt: string;
  refreshTokenKey: string;
} => {
  return {
    uuid: ADMIN_UUID!,
    email: ADMIN_EMAIL!,
    phone: '123456789',
    passcode: ADMIN_PASSWORD!,
    salt: '22fae28a2abbb54a638cb5b7f1acb2e9',
    refreshTokenKey: 'aedc7970d693ea6e4d71e39bffa7dc4034bae8e858b1ad2bb65a5ffd8356db41',
  };
};
