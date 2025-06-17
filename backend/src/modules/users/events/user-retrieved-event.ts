import { Event } from '@core';
import { IGetUserDto } from '../dtos/get-user.dto';

export class UserRetrievedEvent extends Event {
  public readonly user: IGetUserDto;

  constructor(user: IGetUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.user = user;
  }
}
