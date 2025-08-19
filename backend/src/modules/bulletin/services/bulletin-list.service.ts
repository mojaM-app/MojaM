import { BaseService, events, IBulletinGridItemDto, IGridPageResponseDto } from '@core';
import { Container, Service } from 'typedi';
import { vBulletin } from '../../../dataBase/entities/bulletin/vBulletin.entity';
import { BulletinsGridPageDto, GetBulletinListReqDto } from '../dtos/get-bulletin-list.dto';
import { BulletinListRetrievedEvent } from '../events/bulletin-list-retrieved.event';
import { BulletinListRepository } from '../repositories/bulletin-list.repository';

@Service()
export class BulletinListService extends BaseService {
  private readonly _repository: BulletinListRepository;

  constructor() {
    super();
    this._repository = Container.get(BulletinListRepository);
  }

  public async get(reqDto: GetBulletinListReqDto): Promise<BulletinsGridPageDto> {
    const recordsWithTotal: IGridPageResponseDto<vBulletin> = await this._repository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(
      events.bulletin.bulletinListRetrieved,
      new BulletinListRetrievedEvent(reqDto.currentUserId!),
    );

    return {
      items: recordsWithTotal.items.map(entity => this.vBulletinToIBulletinGridItemDto(entity)),
      totalCount: recordsWithTotal.totalCount,
    } satisfies BulletinsGridPageDto;
  }

  private vBulletinToIBulletinGridItemDto(bulletin: vBulletin): IBulletinGridItemDto {
    return {
      id: bulletin.id,
      title: bulletin.title,
      number: bulletin.number,
      date: bulletin.date,
      state: bulletin.state,
      createdAt: bulletin.createdAt,
      createdBy: bulletin.createdBy,
      updatedAt: bulletin.updatedAt,
      updatedBy: bulletin.updatedBy,
      publishedAt: bulletin.publishedAt,
      publishedBy: bulletin.publishedBy,
    } satisfies IBulletinGridItemDto;
  }
}
