import { REGEX_GUID_PATTERN } from '@config';
import { IRoutes } from '@interfaces';
import { validateData } from '@middlewares';
import { ActivateAccountDto, AuthController, LoginDto, RefreshTokenDto, ResetPasswordDto, UserTryingToLogInDto } from '@modules/auth';
import express from 'express';

export class AuthRoute implements IRoutes {
  public static resetPassword: string = 'reset-password';
  public path = '/auth';
  public loginPath = '/login';
  public getUserInfoBeforeLogInPath = `${this.path}/get-user-info-before-log-in`;
  public requestResetPasswordPath = `${this.path}/request-reset-password`;
  public checkResetPasswordTokenPath = `${this.path}/check-reset-password-token`;
  public resetPasswordPath = `${this.path}/${AuthRoute.resetPassword}`;
  public refreshTokenPath = `${this.path}/refresh-token`;
  public getUserToActivatePath = `${this.path}/get-user-to-activate`;
  public activateAccountPath = `${this.path}/activate-account`;
  public router = express.Router();

  private readonly _authController: AuthController;

  public constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.loginPath, [validateData(LoginDto)], this._authController.logIn);
    this.router.post(this.getUserInfoBeforeLogInPath, [validateData(UserTryingToLogInDto)], this._authController.getUserInfoBeforeLogIn);
    this.router.post(this.requestResetPasswordPath, [validateData(UserTryingToLogInDto)], this._authController.requestResetPassword);
    this.router.post(this.checkResetPasswordTokenPath + `/:userId(${REGEX_GUID_PATTERN})/:token`, this._authController.checkResetPasswordToken);
    this.router.post(
      this.resetPasswordPath + `/:userId(${REGEX_GUID_PATTERN})`,
      [validateData(ResetPasswordDto)],
      this._authController.resetPassword,
    );
    this.router.post(this.refreshTokenPath, [validateData(RefreshTokenDto)], this._authController.refreshAccessToken);
    this.router.post(this.getUserToActivatePath + `/:userId(${REGEX_GUID_PATTERN})`, this._authController.getUserToActivate);
    this.router.post(
      this.activateAccountPath + `/:userId(${REGEX_GUID_PATTERN})`,
      [validateData(ActivateAccountDto)],
      this._authController.activateAccount,
    );
    // this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
