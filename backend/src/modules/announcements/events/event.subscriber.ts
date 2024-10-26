import { events } from '@events';
import { AnnouncementsCreatedEvent, AnnouncementsRetrievedEvent } from '@modules/announcements';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class AnnouncementsEventSubscriber {
  @On(events.announcements.retrieved)
  public onAnnouncementsRetrieved(data: AnnouncementsRetrievedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.created)
  public onAnnouncementsCreated(data: AnnouncementsCreatedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' created by user '${data?.currentUserId}'`);
  }
}
