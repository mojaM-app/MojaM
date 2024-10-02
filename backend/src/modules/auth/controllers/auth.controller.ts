import {
  AuthService,
  CheckResetPasswordTokenReqDto,
  CheckResetPasswordTokenResponseDto,
  CheckResetPasswordTokenResultDto,
  GetUserInfoBeforeLogInResponseDto,
  ILoginResult,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  RequestResetPasswordResponseDto,
  UserInfoBeforeLogInResultDto,
  UserTryingToLogInDto,
} from '@modules/auth';
import { BaseController } from '@modules/common';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AuthController extends BaseController {
  private readonly _authService: AuthService;

  public constructor() {
    super();
    this._authService = Container.get(AuthService);
  }

  public getUserInfoBeforeLogIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user: UserTryingToLogInDto = req.body;
      const info: UserInfoBeforeLogInResultDto = await this._authService.getUserInfoBeforeLogIn(user);
      res.status(200).json(new GetUserInfoBeforeLogInResponseDto(info));
    } catch (error) {
      next(error);
    }
  };

  public requestResetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: UserTryingToLogInDto = req.body;
      const result = await this._authService.requestResetPassword(data);
      res.status(200).json(new RequestResetPasswordResponseDto(result));
    } catch (error) {
      next(error);
    }
  }

  public checkResetPasswordToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req?.params?.userId) ? req.params.userId : undefined;
      const resetPasswordToken = req?.params?.token?.length > 0 ? req.params.token : undefined;
      const reqDto = new CheckResetPasswordTokenReqDto(userGuid, resetPasswordToken);
      const result: CheckResetPasswordTokenResultDto = await this._authService.checkResetPasswordToken(reqDto);
      res.status(200).json(new CheckResetPasswordTokenResponseDto(result));
    } catch (error) {
      next(error);
    }
  }

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const loginResult: ILoginResult = await this._authService.login(loginData);

      res
        .status(200)
        .json(new LoginResponseDto({ ...loginResult.user, accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken }));
    } catch (error) {
      next(error);
    }
  };

  public refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken: RefreshTokenDto = req.body;
      const accessToken: string | null = await this._authService.refreshAccessToken(refreshToken);
      res.status(200).json(new RefreshTokenResponseDto(accessToken));
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
