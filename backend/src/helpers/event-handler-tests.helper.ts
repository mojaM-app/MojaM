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
import {
  FailedLoginAttemptEvent,
  InactiveUserTriesToLogInEvent,
  LockedUserTriesToLogInEvent,
  UserLockedOutEvent,
  UserLoggedInEvent,
  UserPasscodeChangedEvent,
  UserRefreshedTokenEvent,
} from '@modules/auth';
import { CalendarEventsRetrievedEvent } from '@modules/calendar';
import { PermissionAddedEvent, PermissionDeletedEvent, PermissionsRetrievedEvent } from '@modules/permissions';
import {
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserDetailsRetrievedEvent,
  UserListRetrievedEvent,
  UserProfileRetrievedEvent,
  UserProfileUpdatedEvent,
  UserRetrievedEvent,
  UserUnlockedEvent,
  UserUpdatedEvent,
} from '@modules/users';
import { EventDispatcher } from 'event-dispatch';

export const testEventHandlers: {
  onUserLoggedIn: (data: any) => void;
  onUserRefreshedToken: (data: any) => void;
  inactiveUserTriesToLogIn: (data: any) => void;
  lockedUserTriesToLogIn: (data: any) => void;
  onUserPasscodeChanged: (data: any) => void;
  onFailedLoginAttempt: (data: any) => void;
  onUserLockedOut: (data: any) => void;
  onUserUnlocked: (data: any) => void;
  onUserCreated: (data: any) => void;
  onUserUpdated: (data: any) => void;
  onUserListRetrieved: (data: any) => void;
  onUserDetailsRetrieved: (data: any) => void;
  onUserRetrieved: (data: any) => void;
  onUserProfileRetrieved: (data: any) => void;
  onUserProfileUpdated: (data: any) => void;
  onUserDeleted: (data: any) => void;
  onUserActivated: (data: any) => void;
  onUserDeactivated: (data: any) => void;
  onPermissionAdded: (data: any) => void;
  onPermissionDeleted: (data: any) => void;
  onPermissionsRetrieved: (data: any) => void;
  onAnnouncementsCreated: (data: any) => void;
  onCurrentAnnouncementsRetrieved: (data: any) => void;
  onAnnouncementsRetrieved: (data: any) => void;
  onAnnouncementsListRetrieved: (data: any) => void;
  onAnnouncementsPublished: (data: any) => void;
  onAnnouncementsDeleted: (data: any) => void;
  onAnnouncementsUpdated: (data: any) => void;
  onCalendarEventsRetrieved: (data: any) => void;
} = {
  onUserLoggedIn: jest.fn((_: UserLoggedInEvent) => {}),
  onUserRefreshedToken: jest.fn((_: UserRefreshedTokenEvent) => {}),
  inactiveUserTriesToLogIn: jest.fn((_: InactiveUserTriesToLogInEvent) => {}),
  lockedUserTriesToLogIn: jest.fn((_: LockedUserTriesToLogInEvent) => {}),
  onFailedLoginAttempt: jest.fn((_: FailedLoginAttemptEvent) => {}),
  onUserLockedOut: jest.fn((_: UserLockedOutEvent) => {}),
  onUserUnlocked: jest.fn((_: UserUnlockedEvent) => {}),
  onUserCreated: jest.fn((_: UserCreatedEvent) => {}),
  onUserUpdated: jest.fn((_: UserUpdatedEvent) => {}),
  onUserListRetrieved: jest.fn((_: UserListRetrievedEvent) => {}),
  onUserDetailsRetrieved: jest.fn((_: UserDetailsRetrievedEvent) => {}),
  onUserRetrieved: jest.fn((_: UserRetrievedEvent) => {}),
  onUserProfileRetrieved: jest.fn((_: UserProfileRetrievedEvent) => {}),
  onUserProfileUpdated: jest.fn((_: UserProfileUpdatedEvent) => {}),
  onUserDeleted: jest.fn((_: UserDeletedEvent) => {}),
  onUserActivated: jest.fn((_: UserActivatedEvent) => {}),
  onUserDeactivated: jest.fn((_: UserDeactivatedEvent) => {}),
  onPermissionAdded: jest.fn((_: PermissionAddedEvent) => {}),
  onPermissionDeleted: jest.fn((_: PermissionDeletedEvent) => {}),
  onPermissionsRetrieved: jest.fn((_: PermissionsRetrievedEvent) => {}),
  onUserPasscodeChanged: jest.fn((_: UserPasscodeChangedEvent) => {}),
  onAnnouncementsCreated: jest.fn((_: AnnouncementsCreatedEvent) => {}),
  onAnnouncementsRetrieved: jest.fn((_: AnnouncementsRetrievedEvent) => {}),
  onCurrentAnnouncementsRetrieved: jest.fn((_: CurrentAnnouncementsRetrievedEvent) => {}),
  onAnnouncementsListRetrieved: jest.fn((_: AnnouncementsListRetrievedEvent) => {}),
  onAnnouncementsPublished: jest.fn((_: AnnouncementsPublishedEvent) => {}),
  onAnnouncementsDeleted: jest.fn((_: AnnouncementsDeletedEvent) => {}),
  onAnnouncementsUpdated: jest.fn((_: AnnouncementsUpdatedEvent) => {}),
  onCalendarEventsRetrieved: jest.fn((_: CalendarEventsRetrievedEvent) => {}),
};

export const registerTestEventHandlers = (eventDispatcher: EventDispatcher): void => {
  // Map test handler names to actual event names
  const eventMapping: Record<string, string> = {
    onUserLoggedIn: events.users.userLoggedIn,
    onUserRefreshedToken: events.users.userRefreshedToken,
    inactiveUserTriesToLogIn: events.users.inactiveUserTriesToLogIn,
    lockedUserTriesToLogIn: events.users.lockedUserTriesToLogIn,
    onUserPasscodeChanged: events.users.userPasscodeChanged,
    onFailedLoginAttempt: events.users.failedLoginAttempt,
    onUserLockedOut: events.users.userLockedOut,
    onUserUnlocked: events.users.userUnlocked,
    onUserCreated: events.users.userCreated,
    onUserUpdated: events.users.userUpdated,
    onUserListRetrieved: events.users.userListRetrieved,
    onUserDetailsRetrieved: events.users.userDetailsRetrieved,
    onUserRetrieved: events.users.userRetrieved,
    onUserProfileRetrieved: events.users.userProfileRetrieved,
    onUserProfileUpdated: events.users.userProfileUpdated,
    onUserDeleted: events.users.userDeleted,
    onUserActivated: events.users.userActivated,
    onUserDeactivated: events.users.userDeactivated,
    onPermissionAdded: events.permissions.permissionAdded,
    onPermissionDeleted: events.permissions.permissionDeleted,
    onPermissionsRetrieved: events.permissions.permissionsRetrieved,
    onAnnouncementsCreated: events.announcements.announcementsCreated,
    onAnnouncementsRetrieved: events.announcements.announcementsRetrieved,
    onCurrentAnnouncementsRetrieved: events.announcements.currentAnnouncementsRetrieved,
    onAnnouncementsListRetrieved: events.announcements.announcementsListRetrieved,
    onAnnouncementsPublished: events.announcements.announcementsPublished,
    onAnnouncementsDeleted: events.announcements.announcementsDeleted,
    onAnnouncementsUpdated: events.announcements.announcementsUpdated,
    onCalendarEventsRetrieved: events.calendar.eventsRetrieved,
  };

  Object.entries(testEventHandlers).forEach(([handlerName, eventHandler]) => {
    const eventName = eventMapping[handlerName];
    if (eventName) {
      eventDispatcher.on(eventName, eventHandler);
    }
  });
};
