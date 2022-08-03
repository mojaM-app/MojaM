import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./components/news/news.module').then(m => m.NewsModule)},
  { path: 'not-found', loadComponent: () => import('./components/static/not-found/not-found.component').then(m => m.NotFoundComponent)},
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
