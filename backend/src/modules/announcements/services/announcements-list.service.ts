import { events } from '@events';
import { IGridPageResponseDto } from '@interfaces';
import {
  AnnouncementsGridPageDto,
  AnnouncementsListRepository,
  AnnouncementsListRetrievedEvent,
  GetAnnouncementListReqDto,
  IAnnouncementGridItemDto,
} from '@modules/announcements';
import { BaseService } from '@modules/common';
import { Container, Service } from 'typedi';
import { vAnnouncement } from '../entities/vAnnouncement.entity';

@Service()
export class AnnouncementsListService extends BaseService {
  private readonly _repository: AnnouncementsListRepository;

  constructor() {
    super();
    this._repository = Container.get(AnnouncementsListRepository);
  }

  public async get(reqDto: GetAnnouncementListReqDto): Promise<AnnouncementsGridPageDto> {
    const recordsWithTotal: IGridPageResponseDto<vAnnouncement> = await this._repository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(events.announcements.announcementsListRetrieved, new AnnouncementsListRetrievedEvent(reqDto.currentUserId!));

    return {
      items: recordsWithTotal.items.map(user => this.vAnnouncementToIAnnouncementGridItemDto(user)),
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
