import { App } from '@/app';
import { ValidateEnv } from '@config';
import { AnnouncementsListRoute, AnnouncementsRout } from '@modules/announcements';
import { CalendarRoutes } from '@modules/calendar';
import { CommunityRoute } from '@modules/community';
import { NewsRoutes } from '@modules/news';
import { PermissionsRoute } from '@modules/permissions';
import { UserDetailsRoute, UserListRoute, UserRoute } from '@modules/users';

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
    new UserDetailsRoute(),
  ]);

  return app;
};

void (async (): Promise<void> => {
  await initializeApp().then((app: App) => {
    app.listen();
  });
})();
