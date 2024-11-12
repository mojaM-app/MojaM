import { SystemPermissionValue } from 'src/core/system-permission.enum';

export interface IRouteData {
  closeSideNav?: boolean;
  hideFooter?: boolean;
}

export interface IPermissionRouteData extends IRouteData {
  permissions: SystemPermissionValue[];
  checkSession?: boolean;
}
