import { events } from '@events';
import { IUser } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class LoginEventSubscriber {
  @On(events.users.userLoggedIn)
  public onLogIn(user: IUser): void {
    console.log('User logged in!');
  }
}
