export interface ITokenPayload {
  exp: number;
  sub: string;
}

export interface IAuthTokenPayload extends ITokenPayload {
  userName?: string | null;
  permissions?: number[];
  email: string;
  phone: string;
}
