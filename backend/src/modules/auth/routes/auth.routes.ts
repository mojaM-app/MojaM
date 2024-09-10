import { Routes } from '@interfaces';
import { validateData } from '@middlewares';
import { AuthController, LoginDto } from '@modules/auth';
import express from 'express';

export class AuthRoute implements Routes {
  public static resetPassword: string = 'reset-password';
  public path = '/auth';
  public loginPath = '/login';
  public getUserWhoLogsInPath = `${this.path}/get-user-who-logs-in`;
  public requestResetPasswordPath = `${this.path}/request-reset-password`;
  public router = express.Router();

  private readonly _authController: AuthController;

  public constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.loginPath, [validateData(LoginDto)], this._authController.logIn);
    this.router.post(this.requestResetPasswordPath, this._authController.requestResetPassword);
    this.router.post(this.getUserWhoLogsInPath, this._authController.getUserWhoLogsIn);
    // this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
