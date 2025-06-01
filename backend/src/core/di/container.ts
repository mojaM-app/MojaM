import { IAuthModuleBoundary, INotificationModuleBoundary, IPermissionModuleBoundary, IUserModuleBoundary } from '@core';
import { Container } from 'typedi';
import { AuthModuleBoundary } from '../../modules/auth/auth-module.boundary';
import { NotificationModuleBoundary } from '../../modules/notifications/notification-module.boundary';
import { PermissionModuleBoundary } from '../../modules/permissions/permission-module.boundary';
import { UserModuleBoundary } from '../../modules/users/user-module.boundary';

export const registerModules = (): void => {
  Container.set<IAuthModuleBoundary>('AUTH_MODULE', Container.get(AuthModuleBoundary));
  Container.set<IUserModuleBoundary>('USER_MODULE', Container.get(UserModuleBoundary));
  Container.set<IPermissionModuleBoundary>('PERMISSION_MODULE', Container.get(PermissionModuleBoundary));
  Container.set<INotificationModuleBoundary>('NOTIFICATION_MODULE', Container.get(NotificationModuleBoundary));
};

export default Container;
