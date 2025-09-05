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
      .select('bulletinDay.Title', 'title')
      .select('bulletinDay.Date', 'date')
      .from(BulletinDay, 'bulletinDay')
      .innerJoin(Bulletin, 'bulletin', 'bulletin.id = bulletinDay.BulletinId')
      .innerJoin(User, 'createdBy', 'createdBy.id = bulletinDay.CreatedById')
      .leftJoin(User, 'updatedBy', 'updatedBy.id = bulletinDay.UpdatedById'),
  name: 'vBulletinDays',
})
export class vBulletinDay {
  @ViewColumn()
  @PrimaryColumn()
  public id!: string;

  @ViewColumn()
  public title: string | null = null;

  @ViewColumn({
    transformer: {
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.anyToAny,
    },
  })
  public date: Date | null = null;
}
