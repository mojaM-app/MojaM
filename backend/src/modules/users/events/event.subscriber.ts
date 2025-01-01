import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { UserActivatedEvent } from '../events/user-activated-event';
import { UserCreatedEvent } from '../events/user-created-event';
import { UserDeactivatedEvent } from '../events/user-deactivated-event';
import { UserDeletedEvent } from '../events/user-deleted-event';
import { UserDetailsRetrievedEvent } from './user-details-retrieved-event';
import { UserListRetrievedEvent } from './user-list-retrieved-event';
import { UserRetrievedEvent } from './user-retrieved-event';
import { UserUnlockedEvent } from './user-unlocked-event';

@EventSubscriber()
export class UserEventSubscriber {
  @On(events.users.userRetrieved)
  public onUserRetrieved(data: UserRetrievedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) retrieved!`);
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) created!`);
  }

  @On(events.users.userDeleted)
  public onUserDeleted(data: UserDeletedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) deleted!`);
  }

  @On(events.users.userActivated)
  public onUserActivated(data: UserActivatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) activated!`);
  }

  @On(events.users.userDeactivated)
  public onUserDeactivated(data: UserDeactivatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) deactivated!`);
  }

  @On(events.users.userUnlocked)
  public onUserUnlocked(data: UserUnlockedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) unlocked!`);
  }
}

@EventSubscriber()
export class UserListEventSubscriber {
  @On(events.users.userListRetrieved)
  public onUserListRetrieved(data: UserListRetrievedEvent): void {
    console.log(`User list retrieved by user with ID: ${data?.currentUserId}`);
  }
}

@EventSubscriber()
export class UserDetailsEventSubscriber {
  @On(events.users.userDetailsRetrieved)
  public onUserDetailsRetrieved(data: UserDetailsRetrievedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) retrieved!`);
  }
}
