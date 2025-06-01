export interface IPasswordService {
  getHash(salt: string, passcode: string): string | null;
}

export interface IResetPasscodeService {
  deleteResetPasscodeTokens(userId: number): Promise<boolean>;
}

export interface ICryptoService {
  generateSalt: () => string;
  generateUserRefreshTokenKey: () => string;
}
