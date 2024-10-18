export const events = {
  news: {
    retrieved: 'onInformationRetrieved',
  },
  calendar: {
    retrieved: 'onCalendarRetrieved',
  },
  announcements: {
    retrieved: 'onAnnouncementsRetrieved',
  },
  community: {
    diaconie: {
      retrieved: 'onDiaconieRetrieved',
    },
    meetings: {
      retrieved: 'onMeetingsRetrieved',
    },
    mission: {
      retrieved: 'onMissionRetrieved',
    },
    structure: {
      retrieved: 'onStructureRetrieved',
    },
    regulations: {
      retrieved: 'onRegulationsRetrieved',
    },
  },
  users: {
    userLoggedIn: 'onUserLoggedIn',
    userRefreshedToken: 'onUserRefreshedToken',
    inactiveUserTriesToLogIn: 'inactiveUserTriesToLogIn',
    lockedUserTriesToLogIn: 'lockedUserTriesToLogIn',
    failedLoginAttempt: 'onFailedLoginAttempt',
    userLockedOut: 'onUserLockedOut',
    userListRetrieved: 'onUserListRetrieved',
    userRetrieved: 'onUserRetrieved',
    userCreated: 'onUserCreated',
    userUpdated: 'onUserUpdated',
    userDeleted: 'onUserDeleted',
    userActivated: 'onUserActivated',
    userDeactivated: 'onUserDeactivated',
    userPasswordChanged: 'onUserPasswordChanged',
  },
  permissions: {
    permissionAdded: 'onPermissionAdded',
    permissionDeleted: 'onPermissionDeleted',
  },
};

export { Event } from './Event';

export { EventDispatcherService } from './event-dispatcher.service';
