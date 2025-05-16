import { EventDispatcherService } from '@events';
import { EventDispatcher } from 'event-dispatch';

export abstract class BaseService {
  protected readonly _eventDispatcher: EventDispatcher;

  constructor() {
    this._eventDispatcher = EventDispatcherService.getEventDispatcher();
  }
}
