export const events = {
  news: {
    retrieved: 'onInformationRetrieved',
  },
  calendar: {
    retrieved: 'onCalendarRetrieved',
  },
  announcements: {
    currentAnnouncementsRetrieved: 'onCurrentAnnouncementsRetrieved',
    announcementsListRetrieved: 'onAnnouncementsListRetrieved',
    announcementsCreated: 'onAnnouncementsCreated',
    announcementsRetrieved: 'onAnnouncementsRetrieved',
    announcementsDeleted: 'onAnnouncementsDeleted',
    announcementsPublished: 'onAnnouncementsPublished',
    announcementsUpdated: 'onAnnouncementsUpdated',
  },
  community: {
    communityRetrieved: 'onCommunityRetrieved',
  },
  users: {
    userLoggedIn: 'onUserLoggedIn',
    userRefreshedToken: 'onUserRefreshedToken',
    inactiveUserTriesToLogIn: 'inactiveUserTriesToLogIn',
    lockedUserTriesToLogIn: 'lockedUserTriesToLogIn',
    failedLoginAttempt: 'onFailedLoginAttempt',
    userLockedOut: 'onUserLockedOut',
    userUnlocked: 'onUserUnlocked',
    userListRetrieved: 'onUserListRetrieved',
    userDetailsRetrieved: 'onUserDetailsRetrieved',
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
