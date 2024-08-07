import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'information', pathMatch: 'full' },
  {
    path: 'announcements',
    loadChildren: () =>
      import('./announcements/announcements.module').then(m => m.AnnouncementsModule),
  },
  {
    path: 'calendar',
    loadChildren: () => import('./calendar/calendar.module').then(m => m.NewsCalendarModule),
  },
  {
    path: 'information',
    loadChildren: () => import('./information/information.module').then(m => m.InformationModule),
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewsRoutingModule {}
