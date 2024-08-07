import { Routes } from '@angular/router';
import { BulletinMenu } from './components/bulletin/bulletin.menu';
import { CommunityMenu } from './components/community/community.menu';
import { NewsMenu } from './components/news/news.menu';
import { SettingsMenu } from './components/settings/settings.menu';

export const routes: Routes = [
  { path: '', redirectTo: NewsMenu.Path, pathMatch: 'full' },
  {
    path: NewsMenu.Path,
    loadChildren: () => import('./components/news/news.module').then(m => m.NewsModule),
  },
  {
    path: BulletinMenu.Path,
    loadChildren: () => import('./components/bulletin/bulletin.module').then(m => m.BulletinModule),
  },
  {
    path: CommunityMenu.Path,
    loadChildren: () => import('./components/community/community.module').then(m => m.CommunityModule),
  },
  {
    path: SettingsMenu.Path,
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'not-found',
    loadComponent: () => import('./components/static/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  { path: '**', redirectTo: '/not-found' },
];
