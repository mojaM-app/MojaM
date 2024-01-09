import { BasePayload } from '@modules/common';

export class UpdateUserDto {
  public isActive?: boolean;
}

export class UpdateUserPayload extends BasePayload {
  userId: number;
  userData: UpdateUserDto;

  constructor(userId: number, userData: UpdateUserDto, currentUserId: number | undefined) {
    super();
    this.userId = userId;
    this.userData = userData;
    this.currentUserId = currentUserId;
  }
}
