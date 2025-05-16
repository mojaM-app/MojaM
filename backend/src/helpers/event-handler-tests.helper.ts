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
  onUserLoggedIn: jest.fn((data: UserLoggedInEvent) => {}),
  onUserRefreshedToken: jest.fn((data: UserRefreshedTokenEvent) => {}),
  inactiveUserTriesToLogIn: jest.fn((data: InactiveUserTriesToLogInEvent) => {}),
  lockedUserTriesToLogIn: jest.fn((data: LockedUserTriesToLogInEvent) => {}),
  onFailedLoginAttempt: jest.fn((data: FailedLoginAttemptEvent) => {}),
  onUserLockedOut: jest.fn((data: UserLockedOutEvent) => {}),
  onUserUnlocked: jest.fn((data: UserUnlockedEvent) => {}),
  onUserCreated: jest.fn((data: UserCreatedEvent) => {}),
  onUserUpdated: jest.fn((data: UserUpdatedEvent) => {}),
  onUserListRetrieved: jest.fn((data: UserListRetrievedEvent) => {}),
  onUserDetailsRetrieved: jest.fn((data: UserDetailsRetrievedEvent) => {}),
  onUserRetrieved: jest.fn((data: UserRetrievedEvent) => {}),
  onUserProfileRetrieved: jest.fn((data: UserProfileRetrievedEvent) => {}),
  onUserProfileUpdated: jest.fn((data: UserProfileUpdatedEvent) => {}),
  onUserDeleted: jest.fn((data: UserDeletedEvent) => {}),
  onUserActivated: jest.fn((data: UserActivatedEvent) => {}),
  onUserDeactivated: jest.fn((data: UserDeactivatedEvent) => {}),
  onPermissionAdded: jest.fn((data: PermissionAddedEvent) => {}),
  onPermissionDeleted: jest.fn((data: PermissionDeletedEvent) => {}),
  onPermissionsRetrieved: jest.fn((data: PermissionsRetrievedEvent) => {}),
  onUserPasscodeChanged: jest.fn((data: UserPasscodeChangedEvent) => {}),
  onAnnouncementsCreated: jest.fn((data: AnnouncementsCreatedEvent) => {}),
  onAnnouncementsRetrieved: jest.fn((data: AnnouncementsRetrievedEvent) => {}),
  onCurrentAnnouncementsRetrieved: jest.fn((data: CurrentAnnouncementsRetrievedEvent) => {}),
  onAnnouncementsListRetrieved: jest.fn((data: AnnouncementsListRetrievedEvent) => {}),
  onAnnouncementsPublished: jest.fn((data: AnnouncementsPublishedEvent) => {}),
  onAnnouncementsDeleted: jest.fn((data: AnnouncementsDeletedEvent) => {}),
  onAnnouncementsUpdated: jest.fn((data: AnnouncementsUpdatedEvent) => {}),
  onCalendarEventsRetrieved: jest.fn((data: CalendarEventsRetrievedEvent) => {}),
};

export const registerTestEventHandlers = (eventDispatcher: EventDispatcher): void => {
  Object.entries(testEventHandlers).forEach(([event, eventHandler]) => {
    eventDispatcher.on(event, eventHandler);
  });
};
