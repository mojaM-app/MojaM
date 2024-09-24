import {
  AuthService,
  GetUserInfoBeforeLogInResponseDto,
  ILoginResult,
  LoginDto,
  LoginResponseDto,
  RequestResetPasswordResponseDto,
  UserInfoBeforeLogInResultDto,
  UserTryingToLogInDto,
} from '@modules/auth';
import { BaseController } from '@modules/common';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AuthController extends BaseController {
  private readonly authService: AuthService;

  public constructor() {
    super();
    this.authService = Container.get(AuthService);
  }

  public getUserInfoBeforeLogIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: UserTryingToLogInDto = req.body;
      const user: UserInfoBeforeLogInResultDto = await this.authService.getUserWhoLogsIn(data);
      res.status(200).json(new GetUserInfoBeforeLogInResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  public requestResetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: UserTryingToLogInDto = req.body;
      const result = await this.authService.requestResetPassword(data);
      res.status(200).json(new RequestResetPasswordResponseDto(result));
    } catch (error) {
      next(error);
    }
  }

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const loginResult: ILoginResult = await this.authService.login(loginData);

      res
        .status(200)
        .json(new LoginResponseDto({ ...loginResult.user, accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken }));
    } catch (error) {
      next(error);
    }
  };

  // public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: IUserDto = req.user;
  //     const logOutUserData: IUserDto = await this.authService.logout(userData);

  //     res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
  //     res.status(200).json({ data: logOutUserData, message: 'logout' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
