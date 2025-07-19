import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'bulletin_day_tasks',
})
export class BulletinDayTask {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_BulletinDayTask_Id',
  })
  public id: number;

  @Column({
    name: 'BulletinDayId',
    type: 'int',
    nullable: false,
  })
  public bulletinDayId: number;

  @Column({
    name: 'TaskOrder',
    type: 'int',
    nullable: false,
  })
  public taskOrder: number;

  @Column({
    name: 'Description',
    type: 'text',
    nullable: false,
  })
  public description: string;

  @Column({
    name: 'HasCommentField',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public hasCommentField: boolean;
}
