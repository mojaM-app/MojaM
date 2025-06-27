import { Event } from '@core';
import type { IGetUserProfileDto } from '../dtos/get-user-profile.dto';

export class UserProfileRetrievedEvent extends Event {
  public readonly user: IGetUserProfileDto;

  constructor(user: IGetUserProfileDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
