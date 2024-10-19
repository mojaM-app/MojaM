import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { FailedLoginAttemptEvent } from './failed-login-attempt-event';
import { InactiveUserTriesToLogInEvent } from './inactive-user-tries-to-log-in-event';
import { LockedUserTriesToLogInEvent } from './locked-user-tries-to-log-in-event';
import { UserLockedOutEvent } from './user-locked-out-event';
import { UserLoggedInEvent } from './user-logged-in-event';
import { UserPasswordChangedEvent } from './user-password-changed-event';
import { UserRefreshedTokenEvent } from './user-refreshed-token-event';

@EventSubscriber()
export class LoginEventSubscriber {
  @On(events.users.userLoggedIn)
  public onLogIn(data: UserLoggedInEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.inactiveUserTriesToLogIn)
  public inactiveUserTriesToLogIn(data: InactiveUserTriesToLogInEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.lockedUserTriesToLogIn)
  public lockedUserTriesToLogIn(data: LockedUserTriesToLogInEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.failedLoginAttempt)
  public onFailedLoginAttempt(data: FailedLoginAttemptEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.userLockedOut)
  public onUserLockedOut(data: UserLockedOutEvent): void {
    console.log(`User ${data?.user?.email} logged in!`);
  }

  @On(events.users.userRefreshedToken)
  public onUserRefreshedToken(data: UserRefreshedTokenEvent): void {
    console.log(`User ${data?.user?.email} refreshed token!`);
  }

  @On(events.users.userPasswordChanged)
  public onUserPasswordChanged(data: UserPasswordChangedEvent): void {
    console.log(`User ${data?.user?.email} changed password!`);
  }
}
