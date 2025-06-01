import { logger } from '@core';
import { events } from '@events';
import {
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserDetailsRetrievedEvent,
  UserListRetrievedEvent,
  UserProfileRetrievedEvent,
  UserProfileUpdatedEvent,
  UserRetrievedEvent,
  UserUnlockedEvent,
  UserUpdatedEvent,
} from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class UserEventsSubscriber {
  @On(events.users.userRetrieved)
  public onUserRetrieved(data: UserRetrievedEvent): void {
    logger.debug(`User ${data?.user?.email} (phone: ${data?.user?.phone}) retrieved by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) created by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userUpdated)
  public onUserUpdated(data: UserUpdatedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) updated by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userDeleted)
  public onUserDeleted(data: UserDeletedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) deleted by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userActivated)
  public onUserActivated(data: UserActivatedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) activated by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userDeactivated)
  public onUserDeactivated(data: UserDeactivatedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) deactivated by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userUnlocked)
  public onUserUnlocked(data: UserUnlockedEvent): void {
    logger.debug(`User ${data?.user?.getFirstLastNameOrEmail()} (phone: ${data?.user?.phone}) unlocked by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userDetailsRetrieved)
  public onUserDetailsRetrieved(data: UserDetailsRetrievedEvent): void {
    logger.debug(`User ${data?.user?.email} (phone: ${data?.user?.phone}) details retrieved by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userListRetrieved)
  public onUserListRetrieved(data: UserListRetrievedEvent): void {
    logger.debug(`User list retrieved by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userProfileRetrieved)
  public onUserProfileRetrieved(data: UserProfileRetrievedEvent): void {
    logger.debug(`User profile ${data?.user?.email} (phone: ${data?.user?.phone}) retrieved by user with id: '${data?.currentUserId}'`);
  }

  @On(events.users.userProfileUpdated)
  public onUserProfileUpdated(data: UserProfileUpdatedEvent): void {
    logger.debug(`User profile ${data?.user?.email} (phone: ${data?.user?.phone}) updated by user with id: '${data?.currentUserId}'`);
  }
}
