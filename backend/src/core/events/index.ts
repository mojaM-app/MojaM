export const events = {
  news: {
    newsRetrieved: 'onNewsRetrieved',
  },
  calendar: {
    eventsRetrieved: 'onCalendarEventsRetrieved',
  },
  announcements: {
    currentAnnouncementsRetrieved: 'onCurrentAnnouncementsRetrieved',
    announcementsListRetrieved: 'onAnnouncementsListRetrieved',
    announcementsCreated: 'onAnnouncementsCreated',
    announcementsRetrieved: 'onAnnouncementsRetrieved',
    announcementsDeleted: 'onAnnouncementsDeleted',
    announcementsPublished: 'onAnnouncementsPublished',
    announcementsUpdated: 'onAnnouncementsUpdated',
    announcementsItemsRetrieved: 'onAnnouncementsItemsRetrieved',
  },
  bulletin: {
    bulletinListRetrieved: 'onBulletinListRetrieved',
    bulletinRetrieved: 'onBulletinRetrieved',
    bulletinCreated: 'onBulletinCreated',
    bulletinUpdated: 'onBulletinUpdated',
    bulletinPublished: 'onBulletinPublished',
    bulletinDeleted: 'onBulletinDeleted',
    bulletinDaysMinMaxDateRetrieved: 'onBulletinDaysMinMaxDateRetrieved',
    bulletinCalendarDaysRetrieved: 'onBulletinCalendarDaysRetrieved',
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
    userPasscodeChanged: 'onUserPasscodeChanged',
    userProfileRetrieved: 'onUserProfileRetrieved',
    userProfileUpdated: 'onUserProfileUpdated',
  },
  permissions: {
    permissionAdded: 'onPermissionAdded',
    permissionDeleted: 'onPermissionDeleted',
    permissionsRetrieved: 'onPermissionsRetrieved',
  },
  log: {
    logListRetrieved: 'onLogListRetrieved',
  },
};

export { Event } from './Event';

export { EventDispatcherService } from './event-dispatcher.service';
