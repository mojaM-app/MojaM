import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BulletinViewsComponent } from './bulletin-views/bulletin-views.component';
import { PermissionGuard } from 'src/services/auth/permission.guard';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IPermissionRouteData } from 'src/core/interfaces/common/route.data';
import { AddBulletinMenu, EditBulletinMenu } from './bulletin.menu';

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
  { path: '**', redirectTo: '', pathMatch: 'full' },
  { path: '', component: BulletinViewsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BulletinRoutingModule {}
