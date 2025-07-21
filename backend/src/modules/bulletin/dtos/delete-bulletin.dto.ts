import { BaseReqDto, events, type IResponse } from '@core';

export class DeleteBulletinReqDto extends BaseReqDto {
  public readonly bulletinUuid: string;

  constructor(bulletinUuid: string, currentUserId: number) {
    super(currentUserId);
    this.bulletinUuid = bulletinUuid;
  }
}

export class DeleteBulletinResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  constructor(data: string) {
    this.data = data;
    this.message = events.bulletin.bulletinDeleted;
  }
}
