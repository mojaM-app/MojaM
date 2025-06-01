export interface IPasscodeService {
  getHash(salt: string, passcode: string | null | undefined): string | null;
}

export interface IResetPasscodeService {
  deleteResetPasscodeTokens(userId: number): Promise<boolean>;
}

export interface ICryptoService {
  generateSalt: () => string;
  generateUserRefreshTokenKey: () => string;
}
