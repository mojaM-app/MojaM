import type { EventDispatcher } from 'event-dispatch';
import { EventDispatcherService } from '../events/event-dispatcher.service';

export abstract class BaseService {
  protected readonly _eventDispatcher: EventDispatcher;

  constructor() {
    this._eventDispatcher = EventDispatcherService.getEventDispatcher();
  }
}
