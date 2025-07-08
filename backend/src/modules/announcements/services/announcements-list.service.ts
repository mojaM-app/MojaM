import { BaseService, events, IAnnouncementGridItemDto, IGridPageResponseDto } from '@core';
import { Container, Service } from 'typedi';
import { vAnnouncement } from '../../../dataBase/entities/announcements/vAnnouncement.entity';
import { AnnouncementsGridPageDto, GetAnnouncementListReqDto } from '../dtos/get-announcement-list.dto';
import { AnnouncementsListRetrievedEvent } from '../events/announcements-list-retrieved-event';
import { AnnouncementsListRepository } from '../repositories/announcements-list.repository';

@Service()
export class AnnouncementsListService extends BaseService {
  private readonly _repository: AnnouncementsListRepository;

  constructor() {
    super();
    this._repository = Container.get(AnnouncementsListRepository);
  }

  public async get(reqDto: GetAnnouncementListReqDto): Promise<AnnouncementsGridPageDto> {
    const recordsWithTotal: IGridPageResponseDto<vAnnouncement> = await this._repository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(
      events.announcements.announcementsListRetrieved,
      new AnnouncementsListRetrievedEvent(reqDto.currentUserId!),
    );

    return {
      items: recordsWithTotal.items.map(entity => this.vAnnouncementToIAnnouncementGridItemDto(entity)),
      totalCount: recordsWithTotal.totalCount,
    } satisfies AnnouncementsGridPageDto;
  }

  private vAnnouncementToIAnnouncementGridItemDto(announcement: vAnnouncement): IAnnouncementGridItemDto {
    return {
      id: announcement.id,
      title: announcement.title,
      state: announcement.state,
      validFromDate: announcement.validFromDate,
      createdAt: announcement.createdAt,
      createdBy: announcement.createdBy,
      updatedAt: announcement.updatedAt,
      publishedAt: announcement.publishedAt,
      publishedBy: announcement.publishedBy,
      itemsCount: announcement.itemsCount,
    } satisfies IAnnouncementGridItemDto;
  }
}
