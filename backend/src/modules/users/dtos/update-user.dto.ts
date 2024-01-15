import { BaseReqDto } from '@modules/common';

export class UpdateUserDto {
  public isActive?: boolean;
}

export class UpdateUserReqDto extends BaseReqDto {
  userId: number;
  userData: UpdateUserDto;

  constructor(userId: number, userData: UpdateUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.userId = userId;
    this.userData = userData;
  }
}
