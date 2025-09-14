import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BulletinViewsComponent } from './bulletin-views/bulletin-views.component';
import { PermissionGuard } from 'src/services/auth/permission.guard';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IPermissionRouteData } from 'src/core/interfaces/common/route.data';
import {
  AddBulletinMenu,
  BulletinDayMenu,
  BulletinListMenu,
  EditBulletinMenu,
  PreviewBulletinMenu,
} from './bulletin.menu';

const routes: Routes = [
  {
    path: AddBulletinMenu.Route,
    loadComponent: () =>
      import('./add-bulletin/add-bulletin.component').then(m => m.AddBulletinComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.AddBulletin],
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  {
    path: EditBulletinMenu.Route + '/:id',
    loadComponent: () =>
      import('./edit-bulletin/edit-bulletin.component').then(m => m.EditBulletinComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.EditBulletin],
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  {
    path: PreviewBulletinMenu.Route + '/:id',
    loadComponent: () =>
      import('./bulletin-preview/bulletin-preview.component').then(m => m.BulletinPreviewComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.PreviewBulletinList],
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  {
    path: BulletinListMenu.Route,
    loadComponent: () =>
      import('./bulletin-list/bulletin-list.component').then(m => m.BulletinListComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.PreviewBulletinList],
    } satisfies IPermissionRouteData,
  },
  {
    path: BulletinDayMenu.Route + '/:id',
    loadComponent: () =>
      import('./bulletin-views/bulletin-day/bulletin-day.component').then(
        m => m.BulletinDayComponent
      ),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [],
      hideFooter: true,
    } satisfies IPermissionRouteData,
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
  { path: '', component: BulletinViewsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BulletinRoutingModule {}
