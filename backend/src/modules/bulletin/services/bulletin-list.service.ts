import { BaseService, events } from '@core';
import { Container, Service } from 'typedi';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';
import { GetBulletinListReqDto, IBulletinListItemDto } from '../dtos/get-bulletin-list.dto';
import { BulletinListRepository } from '../repositories/bulletin-list.repository';

@Service()
export class BulletinListService extends BaseService {
  private readonly _bulletinListRepository: BulletinListRepository;

  constructor() {
    super();
    this._bulletinListRepository = Container.get(BulletinListRepository);
  }

  public async get(reqDto: GetBulletinListReqDto): Promise<IBulletinListItemDto[]> {
    const bulletins = await this._bulletinListRepository.get();

    let filteredBulletins = bulletins;
    if (reqDto.state) {
      filteredBulletins = bulletins.filter(b => b.state === reqDto.state);
    }

    const dtos = filteredBulletins.map(bulletin => this.bulletinToIBulletinListItem(bulletin));

    this._eventDispatcher.dispatch(events.bulletin.bulletinListRetrieved, dtos);

    return dtos;
  }

  private bulletinToIBulletinListItem(bulletin: Bulletin): IBulletinListItemDto {
    return {
      id: bulletin.uuid,
      title: bulletin.title,
      startDate: bulletin.startDate,
      daysCount: bulletin.daysCount,
      state: bulletin.state,
      createdAt: bulletin.createdAt,
      createdBy: '', //TODO zrobić widok
      publishedAt: bulletin.publishedAt,
      publishedBy: null,
    } satisfies IBulletinListItemDto;
  }
}
