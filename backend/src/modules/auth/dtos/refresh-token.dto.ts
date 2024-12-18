import { events } from '@events';
import { IResponse } from '@interfaces';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  public accessToken: string | null | undefined;

  public refreshToken?: string;
}

export class RefreshTokenResponseDto implements IResponse<string | null> {
  public readonly data: string | null;
  public readonly message: string;

  public constructor(newAccessToken: string | null) {
    this.data = newAccessToken;
    this.message = events.users.userRefreshedToken;
  }
}
