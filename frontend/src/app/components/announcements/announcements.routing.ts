import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IPermissionRouteData } from 'src/interfaces/common/route.data';
import { PermissionGuard } from 'src/services/auth/permission.guard';
import {
  AddAnnouncementsMenu,
  AnnouncementsListMenu,
  EditAnnouncementsMenu,
  PreviewAnnouncementsMenu,
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
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  {
    path: AddAnnouncementsMenu.Route + '/:id',
    loadComponent: () =>
      import('./add-announcements/add-announcements.component').then(
        m => m.AddAnnouncementsComponent
      ),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.AddAnnouncements],
      hideFooter: true,
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
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  {
    path: PreviewAnnouncementsMenu.Route + '/:id',
    loadComponent: () =>
      import('./preview-announcements/preview-announcements.component').then(
        m => m.PreviewAnnouncementsComponent
      ),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.AddAnnouncements],
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  {
    path: AnnouncementsListMenu.Route,
    loadComponent: () =>
      import('./announcements-list/announcements-list.component').then(
        m => m.AnnouncementsListComponent
      ),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.PreviewAnnouncementsList],
    } satisfies IPermissionRouteData,
  },
  {
    path: AddAnnouncementsMenu.Route + '/:id',
    redirectTo: AddAnnouncementsMenu.Route,
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
  { path: '', component: CurrentAnnouncementsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnnouncementsRoutingModule {}
