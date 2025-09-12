import { DataSource, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import { BulletinDay } from './bulletin-day.entity';
import { Bulletin } from './bulletin.entity';
import { EntityTransformFunctions } from '../../EntityTransformFunctions';
import { User } from '../users/user.entity';

@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('bulletinDay.Uuid', 'id')
      .addSelect('bulletin.Uuid', 'bulletinId')
      .addSelect('bulletinDay.Title', 'title')
      .addSelect('bulletinDay.Date', 'date')
      .addSelect(
        'CASE WHEN bulletinDay.Date = (SELECT MIN(bd_min.Date) FROM bulletin_days bd_min WHERE bd_min.BulletinId = bulletinDay.BulletinId) THEN 1 ELSE 0 END',
        'isFirstDay',
      )
      .addSelect(
        'CASE WHEN bulletinDay.Date = (SELECT MAX(bd_max.Date) FROM bulletin_days bd_max WHERE bd_max.BulletinId = bulletinDay.BulletinId) THEN 1 ELSE 0 END',
        'isLastDay',
      )
      .from(BulletinDay, 'bulletinDay')
      .innerJoin(Bulletin, 'bulletin', 'bulletin.id = bulletinDay.BulletinId')
      .innerJoin(User, 'createdBy', 'createdBy.id = bulletinDay.CreatedById')
      .leftJoin(User, 'updatedBy', 'updatedBy.id = bulletinDay.UpdatedById')
      .where('bulletin.State = 2'), // Only published bulletins
  name: 'vBulletinDays',
})
export class vBulletinDay {
  @ViewColumn()
  @PrimaryColumn()
  public id!: string;

  @ViewColumn()
  public bulletinId!: string;

  @ViewColumn()
  public title!: string;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public date!: Date;

  @ViewColumn({
    transformer: {
      from: (value: number) => Boolean(value),
      to: (value: boolean) => (value ? 1 : 0),
    },
  })
  public isFirstDay!: boolean;

  @ViewColumn({
    transformer: {
      from: (value: number) => Boolean(value),
      to: (value: boolean) => (value ? 1 : 0),
    },
  })
  public isLastDay!: boolean;
}
