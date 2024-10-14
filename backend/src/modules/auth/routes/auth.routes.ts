import { Routes } from '@interfaces';
import { validateData } from '@middlewares';
import { AuthController, LoginDto, RefreshTokenDto, ResetPasswordDto, UserTryingToLogInDto } from '@modules/auth';
import { REGEX_GUID_PATTERN } from '@utils';
import express from 'express';

export class AuthRoute implements Routes {
  public static resetPassword: string = 'reset-password';
  public path = '/auth';
  public loginPath = '/login';
  public getUserInfoBeforeLogInPath = `${this.path}/get-user-info-before-log-in`;
  public requestResetPasswordPath = `${this.path}/request-reset-password`;
  public checkResetPasswordTokenPath = `${this.path}/check-reset-password-token/:userId(${REGEX_GUID_PATTERN})/:token`;
  public resetPasswordPath = `${this.path}/reset-password`;
  public refreshTokenPath = `${this.path}/refresh-token`;
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
    this.router.post(this.checkResetPasswordTokenPath, this._authController.checkResetPasswordToken);
    this.router.post(this.resetPasswordPath, [validateData(ResetPasswordDto)], this._authController.resetPassword);
    this.router.post(this.refreshTokenPath, [validateData(RefreshTokenDto)], this._authController.refreshAccessToken);
    // this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
