import { CryptoService } from '@modules/auth/services/crypto.service';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_UUID, NODE_ENV } from '../config/index';

export const getAdminLoginData = (): {
  uuid: string;
  email: string;
  phone: string;
  passcode: string;
  salt: string;
  refreshTokenKey: string;
} => {
  const cryptoService = new CryptoService();
  const isProduction = NODE_ENV === 'production';
  return {
    uuid: ADMIN_UUID!,
    email: ADMIN_EMAIL!,
    phone: '123456789',
    passcode: ADMIN_PASSWORD!,
    salt: isProduction ? cryptoService.generateSalt() : '415271758389a96cbce17ea7be976272',
    refreshTokenKey: isProduction
      ? cryptoService.generateUserRefreshTokenKey()
      : 'aedc7970d693ea6e4d71e39bffa7dc4034bae8e858b1ad2bb65a5ffd8356db41',
  };
};
