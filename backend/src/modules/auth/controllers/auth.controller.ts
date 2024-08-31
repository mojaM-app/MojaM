import { AuthService, EmailPhoneDto, ILoginResult, IsLoginValidResponseDto, LoginDto, LoginResponseDto } from '@modules/auth';
import { BaseController } from '@modules/common';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AuthController extends BaseController {
  private readonly authService: AuthService;

  public constructor() {
    super();
    this.authService = Container.get(AuthService);
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

  public isLoginValid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: EmailPhoneDto = req.body;
      const isValid: boolean = await this.authService.isEmailSufficientToLogIn(data);

      res.status(200).json(new IsLoginValidResponseDto(isValid));
    } catch (error) {
      next(error);
    }
  }

  // public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: IUser = req.user;
  //     const logOutUserData: IUser = await this.authService.logout(userData);

  //     res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
  //     res.status(200).json({ data: logOutUserData, message: 'logout' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
