import { events } from '@events';
import {
  AnnouncementsCreatedEvent,
  AnnouncementsDeletedEvent,
  AnnouncementsListRetrievedEvent,
  AnnouncementsPublishedEvent,
  AnnouncementsRetrievedEvent,
  AnnouncementsUpdatedEvent,
  CurrentAnnouncementsRetrievedEvent,
} from '@modules/announcements';
import { EventSubscriber, On } from 'event-dispatch';
import { Service } from 'typedi';
import { logger } from '../logger';

@Service()
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
