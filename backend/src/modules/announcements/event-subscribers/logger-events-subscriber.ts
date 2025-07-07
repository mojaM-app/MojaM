import { DatabaseLoggerService, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { AnnouncementsCreatedEvent } from '../events/announcements-created-event';
import { AnnouncementsDeletedEvent } from '../events/announcements-deleted-event';
import { AnnouncementsListRetrievedEvent } from '../events/announcements-list-retrieved-event';
import { AnnouncementsPublishedEvent } from '../events/announcements-published-event';
import { AnnouncementsRetrievedEvent } from '../events/announcements-retrieved-event';
import { AnnouncementsUpdatedEvent } from '../events/announcements-updated-event';
import { CurrentAnnouncementsRetrievedEvent } from '../events/current-announcements-retrieved-event';

@EventSubscriber()
export class AnnouncementsEventsSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  @On(events.announcements.currentAnnouncementsRetrieved)
  public onCurrentAnnouncementsRetrieved(data: CurrentAnnouncementsRetrievedEvent): void {
    this._databaseLoggerService.debug(
      `Current announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`,
    );
  }

  @On(events.announcements.announcementsRetrieved)
  public onAnnouncementsRetrieved(data: AnnouncementsRetrievedEvent): void {
    this._databaseLoggerService.debug(
      `Announcements '${data?.announcements?.id}' retrieved by user '${data?.currentUserId}'`,
    );
  }

  @On(events.announcements.announcementsCreated)
  public onAnnouncementsCreated(data: AnnouncementsCreatedEvent): void {
    this._databaseLoggerService.debug(
      `Announcements '${data?.announcements?.id}' created by user '${data?.currentUserId}'`,
    );
  }

  @On(events.announcements.announcementsUpdated)
  public onAnnouncementsUpdated(data: AnnouncementsUpdatedEvent): void {
    this._databaseLoggerService.debug(
      `Announcements '${data?.announcements?.id}' updated by user '${data?.currentUserId}'`,
    );
  }

  @On(events.announcements.announcementsDeleted)
  public onAnnouncementsDeleted(data: AnnouncementsDeletedEvent): void {
    this._databaseLoggerService.debug(
      `Announcements '${data?.announcements?.id}' deleted by user '${data?.currentUserId}'`,
    );
  }

  @On(events.announcements.announcementsPublished)
  public onAnnouncementsPublished(data: AnnouncementsPublishedEvent): void {
    this._databaseLoggerService.debug(
      `Announcements '${data?.announcements?.id}' published by user '${data?.currentUserId}'`,
    );
  }

  @On(events.announcements.announcementsListRetrieved)
  public onAnnouncementsListRetrieved(data: AnnouncementsListRetrievedEvent): void {
    this._databaseLoggerService.debug(`Announcements list retrieved by user with id: ${data?.currentUserId}`);
  }
}
