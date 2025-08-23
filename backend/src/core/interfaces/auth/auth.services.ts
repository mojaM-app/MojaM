export interface IPasscodeService {
  getHash: (salt: string, passcode: string | null | undefined) => string | null;
}

export interface ICryptoService {
  generateSalt: () => string;
  generateUserRefreshTokenKey: () => string;
}
