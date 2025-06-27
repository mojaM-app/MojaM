import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DtoTransformFunctions, events, type IResponse } from '@core';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public accessToken: string | null | undefined;

  @IsOptional()
  @IsString()
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public refreshToken?: string;
}

export class RefreshTokenResponseDto implements IResponse<string | null> {
  public readonly data: string | null;
  public readonly message: string;

  constructor(newAccessToken: string | null) {
    this.data = newAccessToken;
    this.message = events.users.userRefreshedToken;
  }
}
