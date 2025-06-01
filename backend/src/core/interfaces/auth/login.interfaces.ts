export interface IAccountTryingToLogInModel {
  email: string | null | undefined;
  phone?: string;
}

export interface ILoginModel extends IAccountTryingToLogInModel {
  passcode: string | null | undefined;
}
