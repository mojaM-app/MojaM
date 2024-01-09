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
    userLoggedIn: 'onUserLoggedIn',
    userRetrieved: 'onUserRetrieved',
    userCreated: 'onUserCreated',
    userDeleted: 'onUserDeleted',
  },
  permissions: {
    permissionAdded: 'onPermissionAdded',
    permissionDeleted: 'onPermissionDeleted',
  },
};
