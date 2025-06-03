import { Container } from 'typedi';
import { IAuthModuleBoundary, INotificationModuleBoundary, IPermissionModuleBoundary, IUserModuleBoundary } from '../interfaces/module-boundaries';

type ModuleRegistrationFunction = () => void;

export class ModuleRegistry {
  private static registrations: ModuleRegistrationFunction[] = [];

  public static addModuleRegistration(registrationFn: ModuleRegistrationFunction): void {
    this.registrations.push(registrationFn);
  }

  public static registerAllModules(): void {
    this.registrations.forEach(registration => registration());
  }

  // Helper methods for modules to register themselves
  public static registerAuthModule(implementation: new () => IAuthModuleBoundary): void {
    Container.set<IAuthModuleBoundary>('AUTH_MODULE', Container.get(implementation));
  }

  public static registerUserModule(implementation: new (...args: any[]) => IUserModuleBoundary): void {
    Container.set<IUserModuleBoundary>('USER_MODULE', Container.get(implementation));
  }

  public static registerPermissionModule(implementation: new (...args: any[]) => IPermissionModuleBoundary): void {
    Container.set<IPermissionModuleBoundary>('PERMISSION_MODULE', Container.get(implementation));
  }

  public static registerNotificationModule(implementation: new (...args: any[]) => INotificationModuleBoundary): void {
    Container.set<INotificationModuleBoundary>('NOTIFICATION_MODULE', Container.get(implementation));
  }
}
