import { App } from '@/app';
import { AnnouncementsRout } from '@modules/announcements';
import { CalendarRoutes } from '@modules/calendar';
import { CommunityRoute } from '@modules/community';
import { NewsRoutes } from '@modules/news';
import { PermissionsRoute } from '@modules/permissions';
import { UserListRoute, UserRoute } from '@modules/users';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([
  new AnnouncementsRout(),
  new CalendarRoutes(),
  new CommunityRoute(),
  new NewsRoutes(),
  new PermissionsRoute(),
  new UserRoute(),
  new UserListRoute(),
]);

app.listen();
