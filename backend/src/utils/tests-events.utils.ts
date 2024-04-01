import {
  FailedLoginAttemptEventDto,
  InactiveUserTriesToLogInEventDto,
  LockedUserTriesToLogInEventDto,
  UserLockedOutEventDto,
  UserLoggedInEventDto,
} from '@modules/auth';
import { UserActivatedEventDto, UserCreatedEventDto, UserDeactivatedEventDto, UserDeletedEventDto, UserRetrievedEventDto } from '@modules/users';
import { EventDispatcher } from 'event-dispatch';

const testEventHandlers: {
  onUserLoggedIn: (data: any) => void;
  inactiveUserTriesToLogIn: (data: any) => void;
  lockedUserTriesToLogIn: (data: any) => void;
  onFailedLoginAttempt: (data: any) => void;
  onUserLockedOut: (data: any) => void;
  onUserCreated: (data: any) => void;
  onUserRetrieved: (data: any) => void;
  onUserDeleted: (data: any) => void;
  onUserActivated: (data: any) => void;
  onUserDeactivated: (data: any) => void;
} = {
  onUserLoggedIn: jest.fn((data: UserLoggedInEventDto) => {}),
  inactiveUserTriesToLogIn: jest.fn((data: InactiveUserTriesToLogInEventDto) => {}),
  lockedUserTriesToLogIn: jest.fn((data: LockedUserTriesToLogInEventDto) => {}),
  onFailedLoginAttempt: jest.fn((data: FailedLoginAttemptEventDto) => {}),
  onUserLockedOut: jest.fn((data: UserLockedOutEventDto) => {}),
  onUserCreated: jest.fn((data: UserCreatedEventDto) => {}),
  onUserRetrieved: jest.fn((data: UserRetrievedEventDto) => {}),
  onUserDeleted: jest.fn((data: UserDeletedEventDto) => {}),
  onUserActivated: jest.fn((data: UserActivatedEventDto) => {}),
  onUserDeactivated: jest.fn((data: UserDeactivatedEventDto) => {}),
};

const registerTestEventHandlers = (eventDispatcher: EventDispatcher): void => {
  Object.entries(testEventHandlers).forEach(([event, eventHandler]) => {
    eventDispatcher.on(event, eventHandler);
  });
};

export { registerTestEventHandlers, testEventHandlers };
