import { IModule, IRoutes } from '@core';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { CommunityModule } from './community/community.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SecurityModule } from './security/security.module';
import { UsersModule } from './users/users.module';

export class ModulesRegistry {
  private static _modules: IModule[] = [
    new NotificationsModule(),
    new AuthModule(),
    new UsersModule(),
    new PermissionsModule(),
    new AnnouncementsModule(),
    new CommunityModule(),
    new NewsModule(),
    new CalendarModule(),
    new SecurityModule(),
  ];

  public static registerAll(): void {
    this._modules.forEach(module => module.register());
  }

  public static getRoutes(): IRoutes[] {
    return this._modules.flatMap(module => module.getRoutes());
  }
}
