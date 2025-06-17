import { logger, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { AnnouncementsCreatedEvent } from '../events/announcements-created-event';
import { AnnouncementsDeletedEvent } from '../events/announcements-deleted-event';
import { AnnouncementsListRetrievedEvent } from '../events/announcements-list-retrieved-event';
import { AnnouncementsPublishedEvent } from '../events/announcements-published-event';
import { AnnouncementsRetrievedEvent } from '../events/announcements-retrieved-event';
import { AnnouncementsUpdatedEvent } from '../events/announcements-updated-event';
import { CurrentAnnouncementsRetrievedEvent } from '../events/current-announcements-retrieved-event';

@EventSubscriber()
export class AnnouncementsEventsSubscriber {
  @On(events.announcements.currentAnnouncementsRetrieved)
  public onCurrentAnnouncementsRetrieved(data: CurrentAnnouncementsRetrievedEvent): void {
    logger.debug(`Current announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsRetrieved)
  public onAnnouncementsRetrieved(data: AnnouncementsRetrievedEvent): void {
    logger.debug(`Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsCreated)
  public onAnnouncementsCreated(data: AnnouncementsCreatedEvent): void {
    logger.debug(`Announcements '${data?.announcements?.id}' created by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsUpdated)
  public onAnnouncementsUpdated(data: AnnouncementsUpdatedEvent): void {
    logger.debug(`Announcements '${data?.announcements?.id}' updated by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsDeleted)
  public onAnnouncementsDeleted(data: AnnouncementsDeletedEvent): void {
    logger.debug(`Announcements '${data?.announcements?.id}' deleted by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsPublished)
  public onAnnouncementsPublished(data: AnnouncementsPublishedEvent): void {
    logger.debug(`Announcements '${data?.announcements?.id}' published by user '${data?.currentUserId}'`);
  }

  @On(events.announcements.announcementsListRetrieved)
  public onAnnouncementsListRetrieved(data: AnnouncementsListRetrievedEvent): void {
    logger.debug(`Announcements list retrieved by user with id: ${data?.currentUserId}`);
  }
}
