import { events } from '@events';
import { UserActivatedEventDto, UserCreatedEventDto, UserDeactivatedEventDto, UserDeletedEventDto, UserRetrievedEventDto } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class UserEventSubscriber {
  @On(events.users.userRetrieved)
  public onUserRetrieved(data: UserRetrievedEventDto): void {
    // console.log(`User ${data.user.email} (phone: ${data.user.phone}) created!`);
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEventDto): void {
    // console.log(`User ${data.user.email} (phone: ${data.user.phone}) created!`);
  }

  @On(events.users.userDeleted)
  public onUserDeleted(data: UserDeletedEventDto): void {
    // console.log(`User ${data.user.email} (phone: ${data.user.phone}) deleted!`);
  }

  @On(events.users.userActivated)
  public onUserActivated(data: UserActivatedEventDto): void {
    // console.log(`User ${data.user.email} (phone: ${data.user.phone}) activated!`);
  }

  @On(events.users.userDeactivated)
  public onUserDeactivated(data: UserDeactivatedEventDto): void {
    // console.log(`User ${data.user.email} (phone: ${data.user.phone}) deactivated!`);
  }
}
