import type { EventDispatcher } from 'event-dispatch';
import { EventDispatcherService } from '@core';

export abstract class BaseService {
  protected readonly _eventDispatcher: EventDispatcher;

  constructor() {
    this._eventDispatcher = EventDispatcherService.getEventDispatcher();
  }
}
