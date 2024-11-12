import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IPermissionRouteData } from 'src/interfaces/common/route.data';
import { PermissionGuard } from 'src/services/auth/permission.guard';
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
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.AddAnnouncements],
    } satisfies IPermissionRouteData,
  },
  {
    path: EditAnnouncementsMenu.Route + '/:id',
    loadComponent: () =>
      import('./edit-announcements/edit-announcements.component').then(
        m => m.EditAnnouncementsComponent
      ),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.EditAnnouncements],
    } satisfies IPermissionRouteData,
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
