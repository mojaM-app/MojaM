import { Routes } from '@angular/router';
import { IRouteData } from 'src/interfaces/common/route.data';
import { AnnouncementsMenu } from './components/announcements/announcements.menu';
import { BulletinMenu } from './components/bulletin/bulletin.menu';
import { CalendarMenu } from './components/calendar/calendar.menu';
import { CommunityMenu } from './components/community/community.menu';
import { ManagementMenu } from './components/management/management.menu';
import { NewsMenu } from './components/news/news.menu';
import { SettingsMenu } from './components/settings/settings.menu';

export const routes: Routes = [
  { path: '', redirectTo: NewsMenu.Path, pathMatch: 'full' },
  {
    path: AnnouncementsMenu.Route,
    loadChildren: () =>
      import('./components/announcements/announcements.module').then(m => m.AnnouncementsModule),
  },
  {
    path: CalendarMenu.Route,
    loadChildren: () => import('./components/calendar/calendar.module').then(m => m.CalendarModule),
  },
  {
    path: NewsMenu.Route,
    loadChildren: () => import('./components/news/news.module').then(m => m.NewsModule),
  },
  {
    path: BulletinMenu.Path,
    loadChildren: () => import('./components/bulletin/bulletin.module').then(m => m.BulletinModule),
  },
  {
    path: CommunityMenu.Path,
    loadChildren: () =>
      import('./components/community/community.module').then(m => m.CommunityModule),
  },
  {
    path: SettingsMenu.Path,
    loadComponent: () =>
      import('./components/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: ManagementMenu.Path,
    loadChildren: () =>
      import('./components/management/management.module').then(m => m.ManagementModule),
  },
  {
    path: 'reset-password/:userId/:token',
    loadComponent: () =>
      import('./components/static/reset-password/reset-password.component').then(
        m => m.ResetPasswordComponent
      ),
    data: { closeSideNav: true, hideFooter: true } satisfies IRouteData,
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./components/static/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: 'no-permission',
    loadComponent: () =>
      import('./components/static/no-permission/no-permission.component').then(
        m => m.NoPermissionComponent
      ),
  },
  { path: '**', redirectTo: '/not-found' },
];
