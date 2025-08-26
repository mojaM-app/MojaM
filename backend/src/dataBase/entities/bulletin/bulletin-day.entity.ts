import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BulletinDaySection } from './bulletin-day-section.entity';
import { Bulletin } from './bulletin.entity';
import { IBulletinDayEntity, ICreateBulletinDay, IUpdateBulletinDay } from '../../../core/interfaces';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { EntityTransformFunctions } from '../../EntityTransformFunctions';
import { User } from '../users/user.entity';

@Entity({
  name: 'bulletin_days',
})
export class BulletinDay implements IBulletinDayEntity, ICreateBulletinDay, IUpdateBulletinDay {
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_BulletinDay_Id',
  })
  public id!: number;

  @ManyToOne(() => Bulletin, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'BulletinId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_BulletinDay_BulletinId_To_Bulletin',
  })
  @Column({
    name: 'BulletinId',
    type: 'int',
    nullable: false,
  })
  public bulletin!: Relation<Bulletin>;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_BulletinDay_Uuid', ['uuid'])
  @Generated('uuid')
  public uuid!: string;

  @Column({
    name: 'Title',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  public title: string | null = null;

  @Column({
    name: 'Date',
    type: 'date',
    nullable: true,
    transformer: {
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.dateToStringDate,
    },
  })
  @Unique('UQ_BulletinDay_Date', ['date'])
  public date: Date | null = null;

  @ManyToOne(() => User, (user: User) => user.createdBulletinDays, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'CreatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_BulletinDay_CreatedById_To_User',
  })
  @Column({
    name: 'CreatedById',
    type: 'int',
    nullable: false,
  })
  public createdBy!: Relation<User>;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
  })
  public createdAt!: Date;

  @ManyToOne(() => User, (user: User) => user.updatedBulletinDays, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UpdatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_BulletinDay_UpdatedById_To_User',
  })
  @Column({
    name: 'UpdatedById',
    type: 'int',
    nullable: true,
  })
  public updatedBy: Relation<User> | undefined;

  @UpdateDateColumn({
    name: 'UpdatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
  })
  public updatedAt!: Date;

  @Column({
    name: 'Settings',
    type: 'json',
    nullable: true,
  })
  public settings: Record<string, any> | null;

  @OneToMany(() => BulletinDaySection, (section: BulletinDaySection) => section.bulletinDay, { cascade: true })
  public sections!: Relation<BulletinDaySection[]>;

  /**
   * Gets the update model for the bulletin day
   * @param title The new title
   * @param date The new date
   * @returns Update model if changes detected, null otherwise
   */
  public getUpdateModel(title?: string | null, date?: Date | null): Partial<IUpdateBulletinDay> | null {
    const result: Partial<IUpdateBulletinDay> = {};
    let wasChanged = false;

    if ((this.title ?? null) !== (title ?? null)) {
      result.title = title;
      wasChanged = true;
    }

    if ((this.date ?? null) !== (date ?? null)) {
      result.date = date;
      wasChanged = true;
    }

    return wasChanged ? result : null;
  }
}
