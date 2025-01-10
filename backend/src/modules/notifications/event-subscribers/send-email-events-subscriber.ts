import { events } from '@events';
import { UserCreatedEvent } from '@modules/users';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class NotificationEventSubscriber {
  @On(events.users.userCreated)
  public onUserCreated(data: UserCreatedEvent): void {
    console.log(`User ${data?.user?.email} (phone: ${data?.user?.phone}) created!`);
  }
}
