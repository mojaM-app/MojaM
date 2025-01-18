import {
  ActivateAccountDto,
  ActivateAccountReqDto,
  ActivateAccountResponseDto,
  AuthService,
  CheckResetPasswordTokenReqDto,
  CheckResetPasswordTokenResponseDto,
  CheckResetPasswordTokenResultDto,
  GetUserInfoBeforeLogInResponseDto,
  GetUserToActivateReqDto,
  GetUserToActivateResponseDto,
  IActivateAccountResultDto,
  ILoginResult,
  IUserInfoBeforeLogInResultDto,
  IUserToActivateResultDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  RequestResetPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordReqDto,
  ResetPasswordResponseDto,
  ResetPasswordResultDto,
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
      const model: UserTryingToLogInDto = req.body;
      const result: IUserInfoBeforeLogInResultDto = await this._authService.getUserInfoBeforeLogIn(model);
      res.status(200).json(new GetUserInfoBeforeLogInResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public requestResetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: UserTryingToLogInDto = req.body;
      const result = await this._authService.requestResetPassword(model);
      res.status(200).json(new RequestResetPasswordResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

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
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req?.params?.userId) ? req.params.userId : undefined;
      const model: ResetPasswordDto = req.body;
      const result: ResetPasswordResultDto = await this._authService.resetPassword(new ResetPasswordReqDto(userGuid, model));
      res.status(200).json(new ResetPasswordResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: LoginDto = req.body;
      const result: ILoginResult = await this._authService.login(model);
      res.status(200).json(
        new LoginResponseDto({
          id: result.user.id,
          email: result.user.email,
          phone: result.user.phone,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  public refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const model: RefreshTokenDto = req.body;
      const result: string | null = await this._authService.refreshAccessToken(model);
      res.status(200).json(new RefreshTokenResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public getUserToActivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req?.params?.userId) ? req.params.userId : undefined;
      const reqDto = new GetUserToActivateReqDto(userGuid);
      const result: IUserToActivateResultDto = await this._authService.getUserToActivate(reqDto);
      res.status(200).json(new GetUserToActivateResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public activateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid = isGuid(req?.params?.userId) ? req.params.userId : undefined;
      const model: ActivateAccountDto = req.body;
      const result: IActivateAccountResultDto = await this._authService.activateAccount(new ActivateAccountReqDto(userGuid, model));
      res.status(200).json(new ActivateAccountResponseDto(result));
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
