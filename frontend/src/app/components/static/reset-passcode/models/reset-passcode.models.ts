export class RequestResetPasscodeDto {
  public readonly email: string;
  public readonly phone?: string;

  public constructor(email: string, phone?: string) {
    this.email = email;
    this.phone = phone;
  }
}

export class ResetPasscodeDto {
  public readonly token: string;
  public readonly passcode: string;

  public constructor(token: string, passcode: string) {
    this.passcode = passcode;
    this.token = token;
  }
}
