import { BaseReqDto, events, type IResponse } from '@core';

export class DeleteBulletinReqDto extends BaseReqDto {
  public readonly bulletinId: string | undefined;

  constructor(bulletinId: string | undefined, currentUserId: number) {
    super(currentUserId);
    this.bulletinId = bulletinId;
  }
}

export class DeleteBulletinResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message: string;

  constructor(data: boolean) {
    this.data = data;
    this.message = events.bulletin.bulletinDeleted;
  }
}
