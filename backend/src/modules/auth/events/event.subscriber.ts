import { events } from '@events';
import { FailedLoginAttemptEventDto, InactiveUserTriesToLogInEventDto, LockedUserTriesToLogInEventDto, UserLockedOutEventDto, UserLoggedInEventDto } from '@modules/auth';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class LoginEventSubscriber {
  @On(events.users.userLoggedIn)
  public onLogIn(data: UserLoggedInEventDto): void {
    // console.log(`User ${data.user.email} logged in!`);
  }

  @On(events.users.inactiveUserTriesToLogIn)
  public inactiveUserTriesToLogIn(data: InactiveUserTriesToLogInEventDto): void {
    // console.log(`User ${data.user.email} logged in!`);
  }

  @On(events.users.lockedUserTriesToLogIn)
  public lockedUserTriesToLogIn(data: LockedUserTriesToLogInEventDto): void {
    // console.log(`User ${data.user.email} logged in!`);
  }

  @On(events.users.failedLoginAttempt)
  public onFailedLoginAttempt(data: FailedLoginAttemptEventDto): void {
    // console.log(`User ${data.user.email} logged in!`);
  }

  @On(events.users.userLockedOut)
  public onUserLockedOut(data: UserLockedOutEventDto): void {
    // console.log(`User ${data.user.email} logged in!`);
  }
}
