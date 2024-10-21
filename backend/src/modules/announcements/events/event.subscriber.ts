import { events } from '@events';
import { AnnouncementsRetrievedEvent } from '@modules/announcements';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class AnnouncementsEventSubscriber {
  @On(events.announcements.retrieved)
  public onAnnouncementsRetrieved(data: AnnouncementsRetrievedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }
}
