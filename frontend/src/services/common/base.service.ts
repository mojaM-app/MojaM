import { environment } from "src/environments/environment";

export class BaseService {

  protected readonly API_ROUTES = {
    community: {
      path: 'community',
      getMeetings: () => `${environment.backendUrl}/${this.API_ROUTES.community.path}/meetings`,

      getDiaconie: () => `${environment.backendUrl}/${this.API_ROUTES.community.path}/diaconie`,

      getMission: () => `${environment.backendUrl}/${this.API_ROUTES.community.path}/mission`,

      getStructure: () => `${environment.backendUrl}/${this.API_ROUTES.community.path}/structure`,

      getRegulations: () => `${environment.backendUrl}/${this.API_ROUTES.community.path}/regulations`,
    },
  };
}
