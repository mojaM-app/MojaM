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
      getUserInfoBeforeLogIn: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/get-user-info-before-log-in`,
      requestResetPassword: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/request-reset-password`,
      checkResetPasswordToken: (uuid: string, token: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/check-reset-password-token/${uuid}/${token}`,
      resetPassword: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/reset-password/${uuid}`,
      refreshToken: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/refresh-token`,
      getUserToActivate: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/get-user-to-activate/${uuid}`,
      activateAccount: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/activate-account/${uuid}`,
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
    },
  };

  protected toDateTime(date: string | null | undefined | Date): Date | undefined {
    if (!date) {
      return undefined;
    }

    return new Date(date);
  }
}
