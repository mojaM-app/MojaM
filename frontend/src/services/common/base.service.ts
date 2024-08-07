import { environment } from "src/environments/environment";

export class BaseService {
  protected readonly API_ROUTES = {
    community: {
      path: 'community',
      getMeetings: (): string => `${environment.backendUrl}/${this.API_ROUTES.community.path}/meetings`,

      getDiaconie: (): string => `${environment.backendUrl}/${this.API_ROUTES.community.path}/diaconie`,

      getMission: (): string => `${environment.backendUrl}/${this.API_ROUTES.community.path}/mission`,

      getStructure: (): string => `${environment.backendUrl}/${this.API_ROUTES.community.path}/structure`,

      getRegulations: (): string => `${environment.backendUrl}/${this.API_ROUTES.community.path}/regulations`,
    },
    news: {
      path: 'news',
      getAnnouncements: (): string => `${environment.backendUrl}/${this.API_ROUTES.news.path}/announcements`,
    },
  };
}
