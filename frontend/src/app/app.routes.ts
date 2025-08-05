import { Routes } from '@angular/router';
import { IRouteData } from 'src/interfaces/common/route.data';
import { AnnouncementsMenu } from './components/announcements/announcements.menu';
import { BulletinMenu } from './components/bulletin/bulletin.menu';
import { CalendarMenu } from './components/calendar/calendar.menu';
import { CommunityMenu } from './components/community/community.menu';
import { ManagementMenu } from './components/management/management.menu';
import { NewsMenu } from './components/news/news.menu';
import { SettingsMenu } from './components/settings/settings.menu';

export const PATHS = {
  NotFound: 'not-found',
  NoPermission: 'no-permission',
};

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
    loadComponent: () =>
      import('./components/community/community.component').then(m => m.CommunityComponent),
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
    path: PATHS.NotFound,
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
  {
    path: 'account/:userId/reset-passcode/:token',
    loadComponent: () =>
      import('./components/static/reset-passcode/reset-passcode.component').then(
        m => m.ResetPasscodeComponent
      ),
    data: { closeSideNav: true, hideFooter: true } satisfies IRouteData,
  },
  {
    path: 'account/:userId/activate/:token',
    loadComponent: () =>
      import('./components/static/activate-account/activate-account.component').then(
        m => m.ActivateAccountComponent
      ),
    data: { closeSideNav: true, hideFooter: true } satisfies IRouteData,
  },
  {
    path: 'account/:userId/unlock/:token',
    loadComponent: () =>
      import('./components/static/unlock-account/unlock-account.component').then(
        m => m.UnlockAccountComponent
      ),
    data: { closeSideNav: true, hideFooter: true } satisfies IRouteData,
  },
  {
    path: 'display-info',
    loadComponent: () =>
      import('./components/static/display-info/display-info.component').then(
        m => m.DisplayInfoComponent
      ),
    data: { closeSideNav: true, hideFooter: true, pullToRefresh: true } satisfies IRouteData,
  },
  { path: '**', redirectTo: '/' + PATHS.NotFound },
];
