import { ILoggerModuleBoundary } from '@core';
import Container, { Service } from 'typedi';
import { AnnouncementsEventsSubscriber } from './event-subscribers/announcements-events-subscriber';
import { AuthEventsSubscriber } from './event-subscribers/auth-events-subscriber';
import { CalendarEventsSubscriber } from './event-subscribers/calendar-events-subscriber';
import { PermissionsEventSubscriber } from './event-subscribers/permissions-events-subscriber';
import { UserEventsSubscriber } from './event-subscribers/user-events-subscriber';

@Service()
export class LoggerModuleBoundary implements ILoggerModuleBoundary {
  constructor() {
    Container.get(AnnouncementsEventsSubscriber);
    Container.get(AuthEventsSubscriber);
    Container.get(CalendarEventsSubscriber);
    Container.get(PermissionsEventSubscriber);
    Container.get(UserEventsSubscriber);
  }
}
