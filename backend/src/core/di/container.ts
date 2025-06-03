import { Container } from 'typedi';
import { ModuleRegistry } from './module-registry';

export const registerModules = (): void => {
  ModuleRegistry.registerAllModules();
};

export default Container;
