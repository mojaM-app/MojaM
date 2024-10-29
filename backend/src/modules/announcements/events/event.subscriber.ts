import { events } from '@events';
import { AnnouncementsCreatedEvent, AnnouncementsDeletedEvent, AnnouncementsPublishedEvent, AnnouncementsRetrievedEvent, CurrentAnnouncementsRetrievedEvent } from '@modules/announcements';
import { EventSubscriber, On } from 'event-dispatch';

@EventSubscriber()
export class AnnouncementsEventSubscriber {
  @On(events.announcements.currentAnnouncementsRetrieved)
  public onCurrentAnnouncementsRetrieved(data: CurrentAnnouncementsRetrievedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsRetrieved)
  public onAnnouncementsRetrieved(data: AnnouncementsRetrievedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsCreated)
  public onAnnouncementsCreated(data: AnnouncementsCreatedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' created by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsDeleted)
  public onAnnouncementsDeleted(data: AnnouncementsDeletedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' deleted by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsPublished)
  public onAnnouncementsPublished(data: AnnouncementsPublishedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' published by user '${data?.currentUserId}'`);
  }
}
