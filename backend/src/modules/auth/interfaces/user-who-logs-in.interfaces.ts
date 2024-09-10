export interface UserWhoLogsIn {
  email: string;
  phone?: string;
}

export interface UserWhoLogsInResult {
  isLoginSufficientToLogIn: boolean;
  isPasswordSet?: boolean;
}
