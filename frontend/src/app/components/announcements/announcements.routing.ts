import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  AddAnnouncementsMenu,
  AnnouncementsListMenu,
  EditAnnouncementsMenu,
} from './announcements.menu';
import { CurrentAnnouncementsComponent } from './current-announcements.component';

const routes: Routes = [
  {
    path: AddAnnouncementsMenu.Route,
    loadComponent: () =>
      import('./add-announcements/add-announcements.component').then(
        m => m.AddAnnouncementsComponent
      ),
  },
  {
    path: EditAnnouncementsMenu.Route + '/:id',
    loadComponent: () =>
      import('./edit-announcements/edit-announcements.component').then(
        m => m.EditAnnouncementsComponent
      ),
  },
  {
    path: AnnouncementsListMenu.Route,
    loadComponent: () =>
      import('./announcements-list/announcements-list.component').then(
        m => m.AnnouncementsListComponent
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
  { path: '', component: CurrentAnnouncementsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnnouncementsRoutingModule {}
