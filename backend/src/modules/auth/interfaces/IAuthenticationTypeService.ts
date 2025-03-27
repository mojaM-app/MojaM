export interface IAuthenticationTypeService {
  getHash: (salt: string, text: string) => string;
  match: (text: string, salt: string, hashedText: string) => boolean;
  isValid: (text: string | undefined | null) => boolean;
}
