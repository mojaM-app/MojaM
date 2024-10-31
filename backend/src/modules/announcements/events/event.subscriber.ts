import { events } from '@events';
import { AnnouncementsCreatedEvent, AnnouncementsDeletedEvent, AnnouncementsPublishedEvent, AnnouncementsRetrievedEvent, CurrentAnnouncementsRetrievedEvent } from '@modules/announcements';
import { EventSubscriber, On } from 'event-dispatch';
import { AnnouncementsListRetrievedEvent } from './announcements-list-retrieved-event';
import { AnnouncementsUpdatedEvent } from './announcements-updated-event';

@EventSubscriber()
export class AnnouncementsEventSubscriber {
  @On(events.announcements.currentAnnouncementsRetrieved)
  public onCurrentAnnouncementsRetrieved(data: CurrentAnnouncementsRetrievedEvent): void {
    console.log(`Current announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsRetrieved)
  public onAnnouncementsRetrieved(data: AnnouncementsRetrievedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsCreated)
  public onAnnouncementsCreated(data: AnnouncementsCreatedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' created by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsUpdated)
  public onAnnouncementsUpdated(data: AnnouncementsUpdatedEvent): void {
    console.log(`Announcements '${data?.announcements?.id}' updated by user '${data?.currentUserId}'`);
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

@EventSubscriber()
export class AnnouncementsListEventSubscriber {
  @On(events.announcements.announcementListRetrieved)
  public onAnnouncementListRetrieved(data: AnnouncementsListRetrievedEvent): void {
    console.log(`Announcements list retrieved by user with ID: ${data?.currentUserId}`);
  }
}
