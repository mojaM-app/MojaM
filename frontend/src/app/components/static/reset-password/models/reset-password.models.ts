export class RequestResetPasswordDto {
  public readonly email: string;
  public readonly phone?: string;

  public constructor(email: string, phone?: string) {
    this.email = email;
    this.phone = phone;
  }
}

export class ResetPasswordDto {
  public readonly token: string;
  public readonly password: string;

  public constructor(token: string, password: string) {
    this.password = password;
    this.token = token;
  }
}
