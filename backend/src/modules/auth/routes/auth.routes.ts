import { Routes } from '@interfaces';
import { validateData } from '@middlewares';
import { AuthController, LoginDto } from '@modules/auth';
import express from 'express';

export class AuthRoute implements Routes {
  public path = '/auth';
  public loginPath = '/login';
  public checkLoginPath = `${this.path}/check-login`;
  public router = express.Router();

  private readonly _authController: AuthController;

  public constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.loginPath, [validateData(LoginDto)], this._authController.logIn);
    this.router.post(this.checkLoginPath, [validateData(String)], this._authController.isLoginValid);
    // this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
