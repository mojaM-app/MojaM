import { ValidateEnv } from '@config';
import { ModulesRegistry } from '@modules/modules-registry';
import { App } from 'app';

// Register all event subscribers
import '@events/register-subscribers';

ValidateEnv();
ModulesRegistry.registerAll();

const initializeApp = async (): Promise<App> => {
  const app = new App();
  await app.initialize([...ModulesRegistry.getRoutes()]);
  return app;
};

void (async (): Promise<void> => {
  await initializeApp().then((app: App) => {
    app.listen();
  });
})();
