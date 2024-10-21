import { AnnouncementsRetrievedEvent } from '@modules/announcements';
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
import { UserActivatedEvent, UserCreatedEvent, UserDeactivatedEvent, UserDeletedEvent, UserListRetrievedEvent, UserRetrievedEvent } from '@modules/users';
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
  onUserRetrieved: (data: any) => void;
  onUserListRetrieved: (data: any) => void;
  onUserDeleted: (data: any) => void;
  onUserActivated: (data: any) => void;
  onUserDeactivated: (data: any) => void;
  onPermissionAdded: (data: any) => void;
  onPermissionDeleted: (data: any) => void;
  onAnnouncementsRetrieved: (data: any) => void;
} = {
  onUserLoggedIn: jest.fn((data: UserLoggedInEvent) => {}),
  onUserRefreshedToken: jest.fn((data: UserRefreshedTokenEvent) => {}),
  inactiveUserTriesToLogIn: jest.fn((data: InactiveUserTriesToLogInEvent) => {}),
  lockedUserTriesToLogIn: jest.fn((data: LockedUserTriesToLogInEvent) => {}),
  onFailedLoginAttempt: jest.fn((data: FailedLoginAttemptEvent) => {}),
  onUserLockedOut: jest.fn((data: UserLockedOutEvent) => {}),
  onUserCreated: jest.fn((data: UserCreatedEvent) => {}),
  onUserRetrieved: jest.fn((data: UserRetrievedEvent) => {}),
  onUserListRetrieved: jest.fn((data: UserListRetrievedEvent) => {}),
  onUserDeleted: jest.fn((data: UserDeletedEvent) => {}),
  onUserActivated: jest.fn((data: UserActivatedEvent) => {}),
  onUserDeactivated: jest.fn((data: UserDeactivatedEvent) => {}),
  onPermissionAdded: jest.fn((data: PermissionAddedEvent) => {}),
  onPermissionDeleted: jest.fn((data: PermissionDeletedEvent) => {}),
  onUserPasswordChanged: jest.fn((data: UserPasswordChangedEvent) => {}),
  onAnnouncementsRetrieved: jest.fn((data: AnnouncementsRetrievedEvent) => {}),
};

const registerTestEventHandlers = (eventDispatcher: EventDispatcher): void => {
  Object.entries(testEventHandlers).forEach(([event, eventHandler]) => {
    eventDispatcher.on(event, eventHandler);
  });
};

export { registerTestEventHandlers, testEventHandlers };
