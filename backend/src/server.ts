import { ValidateEnv } from '@config';
import { registerModules } from '@core';
import { AnnouncementsListRoute, AnnouncementsRout } from '@modules/announcements';
import { AuthRoute } from '@modules/auth';
import { CalendarRoutes } from '@modules/calendar';
import { CommunityRoute } from '@modules/community';
import { NewsRoutes } from '@modules/news';
import { PermissionsRoute } from '@modules/permissions';
import { UserDetailsRoute, UserListRoute, UserProfileRoute, UserRoute } from '@modules/users';
import { App } from 'app';

ValidateEnv();

// Register modules
registerModules();

const initializeApp = async (): Promise<App> => {
  const app = new App();
  await app.initialize([
    new AnnouncementsRout(),
    new AnnouncementsListRoute(),
    new AuthRoute(),
    new CalendarRoutes(),
    new CommunityRoute(),
    new NewsRoutes(),
    new PermissionsRoute(),
    new UserRoute(),
    new UserListRoute(),
    new UserDetailsRoute(),
    new UserProfileRoute(),
  ]);

  return app;
};

void (async (): Promise<void> => {
  await initializeApp().then((app: App) => {
    app.listen();
  });
})();
