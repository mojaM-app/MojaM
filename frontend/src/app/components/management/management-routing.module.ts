import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IPermissionRouteData } from 'src/interfaces/common/route.data';
import { PermissionGuard } from 'src/services/auth/permission.guard';
import {
  ManagementMenuAddUser,
  ManagementMenuEditUser,
  ManagementMenuUserList,
} from './management.menu';

const routes: Routes = [
  {
    path: ManagementMenuUserList.Route,
    loadComponent: () =>
      import('./users/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      permissions: [SystemPermissionValue.PreviewUserList],
    } satisfies IPermissionRouteData,
  },
  {
    path: ManagementMenuAddUser.Route,
    loadComponent: () =>
      import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      hideFooter: true,
      permissions: [SystemPermissionValue.AddUser],
    } satisfies IPermissionRouteData,
  },
  {
    path: ManagementMenuEditUser.Route + '/:id',
    loadComponent: () =>
      import('./users/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [PermissionGuard],
    data: {
      checkSession: true,
      hideFooter: true,
      permissions: [SystemPermissionValue.EditUser],
    } satisfies IPermissionRouteData,
  },
  { path: '**', redirectTo: ManagementMenuUserList.Route, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagementRoutingModule {}
