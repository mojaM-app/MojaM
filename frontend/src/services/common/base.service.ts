import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { environment } from 'src/environments/environment';

export class BaseService {
  protected readonly API_ROUTES = {
    community: {
      path: 'community',
      get: (): string => `${environment.backendUrl}/${this.API_ROUTES.community.path}`,
    },
    announcements: {
      path: 'announcements',
      getCurrent: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/current`,
      get: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/${uuid}`,
      create: (): string => `${environment.backendUrl}/${this.API_ROUTES.announcements.path}`,
      update: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/${uuid}`,
      delete: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/${uuid}`,
      publish: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/${uuid}/publish`,
    },
    announcementsList: {
      path: 'announcements-list',
      get: (): string => `${environment.backendUrl}/${this.API_ROUTES.announcementsList.path}`,
    },
    calendar: {
      path: 'calendar',
      getEvents: (): string => `${environment.backendUrl}/${this.API_ROUTES.calendar.path}/events`,
    },
    auth: {
      path: 'auth',
      login: (): string => `${environment.backendUrl}/login`,
      logout: (): string => `${environment.backendUrl}/logout`,
      getAccountBeforeLogIn: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/get-account-before-log-in`,
      requestResetPasscode: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/request-reset-passcode`,
      checkResetPasscodeToken: (uuid: string, token: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/check-reset-passcode-token/${uuid}/${token}`,
      resetPasscode: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/reset-passcode/${uuid}`,
      refreshToken: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/refresh-token`,
      getAccountToActivate: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/get-account-to-activate/${uuid}`,
      activateAccount: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/activate-account/${uuid}`,
      unlock: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/unlock-account/${uuid}`,
    },
    userList: {
      path: 'user-list',
      get: (): string => `${environment.backendUrl}/${this.API_ROUTES.userList.path}`,
    },
    userDetails: {
      path: 'user-details',
      get: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.userDetails.path}/${uuid}`,
    },
    user: {
      path: 'user',
      get: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.user.path}/${uuid}`,
      create: (): string => `${environment.backendUrl}/${this.API_ROUTES.user.path}`,
      update: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.user.path}/${uuid}`,
      delete: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.user.path}/${uuid}`,
      unlock: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.user.path}/${uuid}/unlock`,
      activate: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.user.path}/${uuid}/activate`,
      deactivate: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.user.path}/${uuid}/deactivate`,
    },
    userProfile: {
      path: 'user-profile',
      get: (): string => `${environment.backendUrl}/${this.API_ROUTES.userProfile.path}`,
      update: (): string => `${environment.backendUrl}/${this.API_ROUTES.userProfile.path}`,
    },
    permissions: {
      path: 'permissions',
      get: (): string => `${environment.backendUrl}/${this.API_ROUTES.permissions.path}`,
      save: (uuid: string, permissionId: SystemPermissionValue): string =>
        `${environment.backendUrl}/${this.API_ROUTES.permissions.path}/${uuid}/${permissionId}`,
    },
  };

  protected toDateTime(date: string | null | undefined | Date): Date | undefined {
    if (!date) {
      return undefined;
    }

    if (date instanceof Date) {
      return date;
    }

    return new Date(date);
  }
}
