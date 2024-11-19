import { App } from '@/app';
import { AnnouncementsListRoute, AnnouncementsRout } from '@modules/announcements';
import { CalendarRoutes } from '@modules/calendar';
import { CommunityRoute } from '@modules/community';
import { NewsRoutes } from '@modules/news';
import { PermissionsRoute } from '@modules/permissions';
import { UserListRoute, UserProfileRoute, UserRoute } from '@modules/users';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const initializeApp = async (): Promise<App> => {
  const app = new App();
  await app.initialize([
    new AnnouncementsRout(),
    new AnnouncementsListRoute(),
    new CalendarRoutes(),
    new CommunityRoute(),
    new NewsRoutes(),
    new PermissionsRoute(),
    new UserRoute(),
    new UserListRoute(),
    new UserProfileRoute(),
  ]);

  return app;
};

void (async (): Promise<void> => {
  await initializeApp().then((app: App) => {
    app.listen();
  });
})();
