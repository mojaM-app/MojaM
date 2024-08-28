import { events } from '@events';
import { IResponse } from '@interfaces';

export class IsLoginValidResponseDto implements IResponse<boolean> {
  data: boolean;
  message?: string | undefined;

  public constructor(data: boolean) {
    this.data = data;
    this.message = events.users.userLoggedIn;
  }
}
