export class BaseService {

  protected readonly API_ROUTES = {
    community: {
      path: 'community',
      getMeetings: () => `${this.API_ROUTES.community.path}/meetings/`,
    },
  };
}
