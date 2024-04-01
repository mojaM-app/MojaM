import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { UserActivatedEventDto } from '../dtos/activate-user.dto';
import { UserCreatedEventDto } from '../dtos/create-user.dto';
import { UserDeactivatedEventDto } from '../dtos/deactivate-user.dto';
import { UserDeletedEventDto } from '../dtos/delete-user.dto';
import { UserRetrievedEventDto } from '../dtos/get-user-profile.dto';

@EventSubscriber()
export class UserEventSubscriber {
  @On(events.users.userRetrieved)
  public onUserRetrieved(data: UserRetrievedEventDto): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) created!`);
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEventDto): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) created!`);
  }

  @On(events.users.userDeleted)
  public onUserDeleted(data: UserDeletedEventDto): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) deleted!`);
  }

  @On(events.users.userActivated)
  public onUserActivated(data: UserActivatedEventDto): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) activated!`);
  }

  @On(events.users.userDeactivated)
  public onUserDeactivated(data: UserDeactivatedEventDto): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) deactivated!`);
  }
}
