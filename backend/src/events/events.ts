export const events = {
  news: {
    information: {
      retrieved: 'onInformationRetrieved',
    },
    calendar: {
      retrieved: 'onCalendarRetrieved',
    },
    announcements: {
      retrieved: 'onAnnouncementsRetrieved',
    },
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
    userRetrieved: 'onUserRetrieved',
    userCreated: 'onUserCreated',
    userDeleted: 'onUserDeleted',
    userLoggedIn: 'onUserLoggedIn',
  },
  permissions: {
    permissionAdded: 'onPermissionAdded',
    permissionDeleted: 'onPermissionDeleted',
  },
};
