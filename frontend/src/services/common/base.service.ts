export class BaseService {

  protected readonly API_ROUTES = {
    community: {
      path: 'community',
      getMeetings: () => `${this.API_ROUTES.community.path}/meetings/`,

      getDiaconie: () => `${this.API_ROUTES.community.path}/diaconie/`,

      getMission: () => `${this.API_ROUTES.community.path}/mission/`,

      getStructure: () => `${this.API_ROUTES.community.path}/structure/`,

      getRegulations: () => `${this.API_ROUTES.community.path}/regulations/`,
    },
  };
}
