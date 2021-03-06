import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./components/news/news.module').then(m => m.NewsModule)},
  { path: 'news', redirectTo: '' },
  { path: 'bulletin', loadChildren: () => import('./components/bulletin/bulletin.module').then(m => m.BulletinModule)},
  { path: 'community', loadChildren: () => import('./components/community/community.module').then(m => m.CommunityModule)},
  { path: 'not-found', loadComponent: () => import('./components/static/not-found/not-found.component').then(m => m.NotFoundComponent)},
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
