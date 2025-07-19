import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({
  name: 'user_bulletin_progress',
})
export class UserBulletinProgress {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_UserBulletinProgress_Id',
  })
  public id: number;

  @Column({
    name: 'UserId',
    type: 'int',
    nullable: false,
  })
  public userId: number;

  @Column({
    name: 'BulletinId',
    type: 'int',
    nullable: false,
  })
  public bulletinId: number;

  @Column({
    name: 'DayNumber',
    type: 'int',
    nullable: false,
  })
  public dayNumber: number;

  @Column({
    name: 'IsCompleted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public isCompleted: boolean;

  @CreateDateColumn({
    name: 'CreatedAt',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    name: 'CompletedAt',
    type: 'timestamp',
    nullable: true,
  })
  public completedAt: Date | null;
}
