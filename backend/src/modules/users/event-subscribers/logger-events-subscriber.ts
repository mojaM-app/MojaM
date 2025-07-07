import { DatabaseLoggerService, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { UserActivatedEvent } from '../events/user-activated-event';
import { UserCreatedEvent } from '../events/user-created-event';
import { UserDeactivatedEvent } from '../events/user-deactivated-event';
import { UserDeletedEvent } from '../events/user-deleted-event';
import { UserDetailsRetrievedEvent } from '../events/user-details-retrieved-event';
import { UserListRetrievedEvent } from '../events/user-list-retrieved-event';
import { UserProfileRetrievedEvent } from '../events/user-profile-retrieved-event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated-event';
import { UserRetrievedEvent } from '../events/user-retrieved-event';
import { UserUnlockedEvent } from '../events/user-unlocked-event';
import { UserUpdatedEvent } from '../events/user-updated-event';

@EventSubscriber()
export class UserEventsSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  @On(events.users.userRetrieved)
  public onUserRetrieved(data: UserRetrievedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.email} (phone: ${data.user.phone}) retrieved by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.getFirstLastNameOrEmail()} (phone: ${data.user.phone}) created by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userUpdated)
  public onUserUpdated(data: UserUpdatedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.getFirstLastNameOrEmail()} (phone: ${data.user.phone}) updated by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userDeleted)
  public onUserDeleted(data: UserDeletedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.getFirstLastNameOrEmail()} (phone: ${data.user.phone}) deleted by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userActivated)
  public onUserActivated(data: UserActivatedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.getFirstLastNameOrEmail()} (phone: ${data.user.phone}) activated by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userDeactivated)
  public onUserDeactivated(data: UserDeactivatedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.getFirstLastNameOrEmail()} (phone: ${data.user.phone}) deactivated by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userUnlocked)
  public onUserUnlocked(data: UserUnlockedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.getFirstLastNameOrEmail()} (phone: ${data.user.phone}) unlocked by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userDetailsRetrieved)
  public onUserDetailsRetrieved(data: UserDetailsRetrievedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.user.email} (phone: ${data.user.phone}) details retrieved by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userListRetrieved)
  public onUserListRetrieved(data: UserListRetrievedEvent): void {
    this._databaseLoggerService.debug(`User list retrieved by user with id: '${data.currentUserId}'`);
  }

  @On(events.users.userProfileRetrieved)
  public onUserProfileRetrieved(data: UserProfileRetrievedEvent): void {
    this._databaseLoggerService.debug(
      `User profile ${data.user.email} (phone: ${data.user.phone}) retrieved by user with id: '${data.currentUserId}'`,
    );
  }

  @On(events.users.userProfileUpdated)
  public onUserProfileUpdated(data: UserProfileUpdatedEvent): void {
    this._databaseLoggerService.debug(
      `User profile ${data.user.email} (phone: ${data.user.phone}) updated by user with id: '${data.currentUserId}'`,
    );
  }
}
