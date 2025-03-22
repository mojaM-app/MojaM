import { REGEX_PATTERNS } from '@config';
import { IRoutes } from '@interfaces';
import { validateData } from '@middlewares';
import { AccountTryingToLogInDto, ActivateAccountDto, AuthController, LoginDto, RefreshTokenDto, ResetPasswordDto } from '@modules/auth';
import express from 'express';

export class AuthRoute implements IRoutes {
  public static resetPassword: string = 'reset-password';
  public path = '/auth';
  public loginPath = '/login';
  public getAccountBeforeLogInPath = `${this.path}/get-account-before-log-in`;
  public requestResetPasswordPath = `${this.path}/request-reset-password`;
  public checkResetPasswordTokenPath = `${this.path}/check-reset-password-token`;
  public resetPasswordPath = `${this.path}/${AuthRoute.resetPassword}`;
  public refreshTokenPath = `${this.path}/refresh-token`;
  public getAccountToActivatePath = `${this.path}/get-account-to-activate`;
  public activateAccountPath = `${this.path}/activate-account`;
  public router = express.Router();

  private readonly _authController: AuthController;

  public constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.loginPath, [validateData(LoginDto)], this._authController.logIn);
    this.router.post(this.getAccountBeforeLogInPath, [validateData(AccountTryingToLogInDto)], this._authController.getAccountBeforeLogIn);
    this.router.post(this.requestResetPasswordPath, [validateData(AccountTryingToLogInDto)], this._authController.requestResetPassword);
    this.router.post(this.checkResetPasswordTokenPath + `/:userId(${REGEX_PATTERNS.GUID})/:token`, this._authController.checkResetPasswordToken);
    this.router.post(
      this.resetPasswordPath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [validateData(ResetPasswordDto)],
      this._authController.resetPassword,
    );
    this.router.post(this.refreshTokenPath, [validateData(RefreshTokenDto)], this._authController.refreshAccessToken);
    this.router.post(this.getAccountToActivatePath + `/:userId(${REGEX_PATTERNS.GUID})`, this._authController.getAccountToActivate);
    this.router.post(
      this.activateAccountPath + `/:userId(${REGEX_PATTERNS.GUID})`,
      [validateData(ActivateAccountDto)],
      this._authController.activateAccount,
    );
    // this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
