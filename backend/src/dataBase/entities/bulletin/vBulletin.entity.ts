import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { Bulletin } from './bulletin.entity';
import { IBulletinGridItemDto } from '../../../core/dtos';
import { EntityTransformFunctions } from '../../EntityTransformFunctions';
import { User } from '../users/user.entity';

export const BulletinListViewColumns: { [K in keyof IBulletinGridItemDto]: string } = {
  id: 'id',
  title: 'title',
  number: 'number',
  date: 'date',
  state: 'state',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedAt: 'updatedAt',
  updatedBy: 'updatedBy',
  publishedAt: 'publishedAt',
  publishedBy: 'publishedBy',
} as const;

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('bulletin.Uuid', BulletinListViewColumns.id)
      .addSelect('bulletin.Title', BulletinListViewColumns.title)
      .addSelect('bulletin.Number', BulletinListViewColumns.number)
      .addSelect('bulletin.Date', BulletinListViewColumns.date)
      .addSelect('bulletin.State', BulletinListViewColumns.state)
      .addSelect('bulletin.CreatedAt', BulletinListViewColumns.createdAt)
      .addSelect("concat(createdBy.FirstName, ' ', createdBy.LastName)", BulletinListViewColumns.createdBy)
      .addSelect('bulletin.UpdatedAt', BulletinListViewColumns.updatedAt)
      .addSelect("concat(updatedBy.FirstName, ' ', updatedBy.LastName)", BulletinListViewColumns.updatedBy)
      .addSelect('bulletin.PublishedAt', BulletinListViewColumns.publishedAt)
      .addSelect("concat(publishedBy.FirstName, ' ', publishedBy.LastName)", BulletinListViewColumns.publishedBy)
      .from(Bulletin, 'bulletin')
      .innerJoin(User, 'createdBy', 'createdBy.id = bulletin.CreatedById')
      .leftJoin(User, 'updatedBy', 'updatedBy.id = bulletin.UpdatedById')
      .leftJoin(User, 'publishedBy', 'publishedBy.id = bulletin.PublishedById'),
  name: 'vBulletins',
})
export class vBulletin implements IBulletinGridItemDto {
  @ViewColumn()
  @PrimaryColumn()
  public id!: string;

  @ViewColumn()
  public title: string | null = null;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.anyToNumber,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public number: number | null = null;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public date: Date | null = null;

  @ViewColumn()
  public state!: number;

  @ViewColumn()
  public createdAt!: Date;

  @ViewColumn()
  public createdBy!: string;

  @ViewColumn()
  public updatedAt!: Date;

  @ViewColumn()
  public updatedBy: string | null = null;

  @ViewColumn()
  public publishedAt: Date | null = null;

  @ViewColumn()
  public publishedBy: string | null = null;
}
