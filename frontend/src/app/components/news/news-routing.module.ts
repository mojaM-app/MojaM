import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnnouncementsMenu, CalendarMenu, InformationMenu } from './news.menu';

const routes: Routes = [
  { path: '', redirectTo: InformationMenu.Route, pathMatch: 'full' },
  {
    path: AnnouncementsMenu.Route,
    loadChildren: () =>
      import('./announcements/announcements.module').then(m => m.AnnouncementsModule),
  },
  {
    path: CalendarMenu.Route,
    loadChildren: () => import('./calendar/calendar.module').then(m => m.NewsCalendarModule),
  },
  {
    path: InformationMenu.Route,
    loadChildren: () => import('./information/information.module').then(m => m.InformationModule),
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewsRoutingModule {}
