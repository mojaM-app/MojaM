import { environment } from 'src/environments/environment';

export class BaseService {
  protected readonly API_ROUTES = {
    community: {
      path: 'community',
      getMeetings: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.community.path}/meetings`,

      getDiaconie: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.community.path}/diaconie`,

      getMission: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.community.path}/mission`,

      getStructure: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.community.path}/structure`,

      getRegulations: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.community.path}/regulations`,
    },
    announcements: {
      path: 'announcements',
      getCurrent: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/current`,
      create: (): string => `${environment.backendUrl}/${this.API_ROUTES.announcements.path}`,
      delete: (uuid: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.announcements.path}/${uuid}`,
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
      checkResetPasswordToken: (userId: string, token: string): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/check-reset-password-token/${userId}/${token}`,
      resetPassword: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/reset-password`,
      refreshToken: (): string =>
        `${environment.backendUrl}/${this.API_ROUTES.auth.path}/refresh-token`,
    },
    userList: {
      path: 'user-list',
      get: (): string => `${environment.backendUrl}/${this.API_ROUTES.userList.path}`,
    },
  };

  protected toDateTime(date: string | null | undefined | Date): Date | undefined {
    if (!date) {
      return undefined;
    }

    return new Date(date);
  }
}
