import { BaseReqDto, events, type IResponse } from '@core';

export class PublishBulletinReqDto extends BaseReqDto {
  public readonly bulletinId: string | undefined;

  constructor(bulletinId: string | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.bulletinId = bulletinId;
  }
}

export class PublishBulletinResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message: string;

  constructor(data: string) {
    this.data = data;
    this.message = events.bulletin.bulletinPublished;
  }
}
