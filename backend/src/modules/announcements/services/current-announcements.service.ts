import { events } from '@events';
import {
  AnnouncementsRepository,
  CurrentAnnouncementsRepository,
  CurrentAnnouncementsRetrievedEvent,
  ICurrentAnnouncementsDto,
  IGetCurrentAnnouncementsDto,
} from '@modules/announcements';
import { BaseService } from '@modules/common';
import { isNullOrUndefined } from '@utils';
import Container, { Service } from 'typedi';
import { Announcement } from '../../../dataBase/entities/announcements/announcement.entity';

@Service()
export class CurrentAnnouncementsService extends BaseService {
  private readonly _currentAnnouncementsRepository: CurrentAnnouncementsRepository;
  private readonly _announcementsRepository: AnnouncementsRepository;

  constructor() {
    super();
    this._currentAnnouncementsRepository = Container.get(CurrentAnnouncementsRepository);
    this._announcementsRepository = Container.get(AnnouncementsRepository);
  }

  public async get(currentUserId: number | undefined): Promise<IGetCurrentAnnouncementsDto> {
    const announcement = await this._currentAnnouncementsRepository.get();

    const currentAnnouncements = isNullOrUndefined(announcement) ? null : this.announcementToICurrentAnnouncements(announcement!);
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

  private announcementToICurrentAnnouncements(announcement: Announcement): ICurrentAnnouncementsDto {
    return {
      id: announcement.uuid,
      title: announcement.title,
      validFromDate: announcement.validFromDate!,
      createdBy: announcement.createdBy.getFirstLastName()!,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      publishedBy: announcement.publishedBy!.getFirstLastName()!,
      publishedAt: announcement.publishedAt!,
      items: announcement.items.map(item => ({
        id: item.id,
        content: item.content,
        createdBy: item.createdBy.getFirstLastName()!,
        createdAt: item.createdAt,
        updatedBy: item.updatedBy?.getFirstLastName() ?? undefined,
        updatedAt: item.updatedAt,
      })),
    } satisfies ICurrentAnnouncementsDto;
  }
}
