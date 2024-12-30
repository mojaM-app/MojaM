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
  UserPasswordChangedEvent,
  UserRefreshedTokenEvent,
} from '@modules/auth';
import { PermissionAddedEvent, PermissionDeletedEvent } from '@modules/permissions';
import {
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserDetailsRetrievedEvent,
  UserListRetrievedEvent,
  UserRetrievedEvent,
} from '@modules/users';
import { EventDispatcher } from 'event-dispatch';

const testEventHandlers: {
  onUserLoggedIn: (data: any) => void;
  onUserRefreshedToken: (data: any) => void;
  inactiveUserTriesToLogIn: (data: any) => void;
  lockedUserTriesToLogIn: (data: any) => void;
  onUserPasswordChanged: (data: any) => void;
  onFailedLoginAttempt: (data: any) => void;
  onUserLockedOut: (data: any) => void;
  onUserCreated: (data: any) => void;
  onUserListRetrieved: (data: any) => void;
  onUserDetailsRetrieved: (data: any) => void;
  onUserRetrieved: (data: any) => void;
  onUserDeleted: (data: any) => void;
  onUserActivated: (data: any) => void;
  onUserDeactivated: (data: any) => void;
  onPermissionAdded: (data: any) => void;
  onPermissionDeleted: (data: any) => void;
  onAnnouncementsCreated: (data: any) => void;
  onCurrentAnnouncementsRetrieved: (data: any) => void;
  onAnnouncementsRetrieved: (data: any) => void;
  onAnnouncementsListRetrieved: (data: any) => void;
  onAnnouncementsPublished: (data: any) => void;
  onAnnouncementsDeleted: (data: any) => void;
  onAnnouncementsUpdated: (data: any) => void;
} = {
  onUserLoggedIn: jest.fn((data: UserLoggedInEvent) => {}),
  onUserRefreshedToken: jest.fn((data: UserRefreshedTokenEvent) => {}),
  inactiveUserTriesToLogIn: jest.fn((data: InactiveUserTriesToLogInEvent) => {}),
  lockedUserTriesToLogIn: jest.fn((data: LockedUserTriesToLogInEvent) => {}),
  onFailedLoginAttempt: jest.fn((data: FailedLoginAttemptEvent) => {}),
  onUserLockedOut: jest.fn((data: UserLockedOutEvent) => {}),
  onUserCreated: jest.fn((data: UserCreatedEvent) => {}),
  onUserListRetrieved: jest.fn((data: UserListRetrievedEvent) => {}),
  onUserDetailsRetrieved: jest.fn((data: UserDetailsRetrievedEvent) => {}),
  onUserRetrieved: jest.fn((data: UserRetrievedEvent) => {}),
  onUserDeleted: jest.fn((data: UserDeletedEvent) => {}),
  onUserActivated: jest.fn((data: UserActivatedEvent) => {}),
  onUserDeactivated: jest.fn((data: UserDeactivatedEvent) => {}),
  onPermissionAdded: jest.fn((data: PermissionAddedEvent) => {}),
  onPermissionDeleted: jest.fn((data: PermissionDeletedEvent) => {}),
  onUserPasswordChanged: jest.fn((data: UserPasswordChangedEvent) => {}),
  onAnnouncementsCreated: jest.fn((data: AnnouncementsCreatedEvent) => {}),
  onAnnouncementsRetrieved: jest.fn((data: AnnouncementsRetrievedEvent) => {}),
  onCurrentAnnouncementsRetrieved: jest.fn((data: CurrentAnnouncementsRetrievedEvent) => {}),
  onAnnouncementsListRetrieved: jest.fn((data: AnnouncementsListRetrievedEvent) => {}),
  onAnnouncementsPublished: jest.fn((data: AnnouncementsPublishedEvent) => {}),
  onAnnouncementsDeleted: jest.fn((data: AnnouncementsDeletedEvent) => {}),
  onAnnouncementsUpdated: jest.fn((data: AnnouncementsUpdatedEvent) => {}),
};

const registerTestEventHandlers = (eventDispatcher: EventDispatcher): void => {
  Object.entries(testEventHandlers).forEach(([event, eventHandler]) => {
    eventDispatcher.on(event, eventHandler);
  });
};

export { registerTestEventHandlers, testEventHandlers };
