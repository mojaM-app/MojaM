import { events } from '@events';
import {
  AnnouncementsRepository,
  announcementToICurrentAnnouncements,
  CurrentAnnouncementsRepository,
  CurrentAnnouncementsRetrievedEvent,
  IGetCurrentAnnouncementsDto,
} from '@modules/announcements';
import { BaseService } from '@modules/common';
import { isNullOrUndefined } from '@utils';
import Container, { Service } from 'typedi';

@Service()
export class CurrentAnnouncementsService extends BaseService {
  private readonly _currentAnnouncementsRepository: CurrentAnnouncementsRepository;
  private readonly _announcementsRepository: AnnouncementsRepository;

  public constructor() {
    super();
    this._currentAnnouncementsRepository = Container.get(CurrentAnnouncementsRepository);
    this._announcementsRepository = Container.get(AnnouncementsRepository);
  }

  public async get(currentUserId: number | undefined): Promise<IGetCurrentAnnouncementsDto> {
    const announcement = await this._currentAnnouncementsRepository.get();

    const currentAnnouncements = isNullOrUndefined(announcement) ? null : announcementToICurrentAnnouncements(announcement!);
    const count = await this._announcementsRepository.count();

    if (!isNullOrUndefined(announcement)) {
      this._eventDispatcher.dispatch(
        events.announcements.currentAnnouncementsRetrieved,
        new CurrentAnnouncementsRetrievedEvent(currentAnnouncements, currentUserId),
      );
    }

    return {
      currentAnnouncements,
      announcementsCount: count,
    } satisfies IGetCurrentAnnouncementsDto;
  }
}
