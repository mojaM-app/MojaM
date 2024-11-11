export interface ITokenPayload {
  exp: number;
  sub: string;
}

export interface IAuthTokenPayload extends ITokenPayload {
  userName?: string;
  permissions?: number[];
}
