import { ValidateEnv } from '@config';
import { fileLogger as logger } from '@core';
import { DbConnectionManager } from '@db';
import { ModulesRegistry } from '@modules/modules-registry';
import { App } from 'app';

ValidateEnv();
ModulesRegistry.registerAll();

const initializeApp = async (): Promise<App> => {
  const app = new App();
  await app.initialize([...ModulesRegistry.getRoutes()]);
  return app;
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await DbConnectionManager.gracefulShutdown();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

void (async (): Promise<void> => {
  try {
    const app = await initializeApp();
    app.listen();
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
})();
