export { LinkHelper } from './helpers/link.helper';

export { UserCreatedEventSubscriber } from './event-subscribers/user-created-events-subscriber';
export { UserLockedOutEventSubscriber } from './event-subscribers/user-locked-out-events-subscriber';

// Module self-registration
import { NotificationModuleBoundary } from './notification-module.boundary';
import { ModuleRegistry } from '../../core/di/module-registry';

ModuleRegistry.addModuleRegistration(() => {
  ModuleRegistry.registerNotificationModule(NotificationModuleBoundary);
});
