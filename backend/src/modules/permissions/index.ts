export { PermissionAddedEvent } from './events/permission-added-event';
export { PermissionDeletedEvent } from './events/permission-deleted-event';
export { PermissionsRetrievedEvent } from './events/permissions-retrieved-event';

export { PermissionsRoute } from './routes/permissions.routes';

// Module self-registration
import { PermissionModuleBoundary } from './permission-module.boundary';
import { ModuleRegistry } from '../../core/di/module-registry';

ModuleRegistry.addModuleRegistration(() => {
  ModuleRegistry.registerPermissionModule(PermissionModuleBoundary);
});
