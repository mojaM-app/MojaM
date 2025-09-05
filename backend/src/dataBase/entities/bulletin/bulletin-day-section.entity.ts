import {
  IBulletinDaySectionEntity,
  ICreateBulletinDaySection,
  IUpdateBulletinDaySection,
} from '@core/interfaces/bulletin/bulletin-day-section.interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BulletinDay } from './bulletin-day.entity';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { User } from '../users/user.entity';

@Entity({
  name: 'bulletin_day_sections',
})
export class BulletinDaySection
  implements IBulletinDaySectionEntity, ICreateBulletinDaySection, IUpdateBulletinDaySection
{
  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_BulletinDaySection_Id',
  })
  public id!: number;

  @ManyToOne(() => BulletinDay, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'DayId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_BulletinDaySection_DayId_To_BulletinDay',
  })
  @Column({
    name: 'DayId',
    type: 'int',
    nullable: false,
  })
  public bulletinDay!: Relation<BulletinDay>;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_BulletinDaySection_Uuid', ['uuid'])
  @Generated('uuid')
  public uuid!: string;

  @Column({
    name: 'Order',
    type: 'int',
    nullable: false,
    default: 0,
  })
  public order!: number;

  @Column({
    name: 'Type',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  public type!: string;

  @Index('IX_BulletinDaySection_Title_Fulltext', { fulltext: true })
  @Column({
    name: 'Title',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  public title: string | null = null;

  @Index('IX_BulletinDaySection_Content_Fulltext', { fulltext: true })
  @Column({
    name: 'Content',
    type: 'text',
    nullable: true,
  })
  public content: string | null = null;

  @ManyToOne(() => User, (user: User) => user.createdBulletinDaySections, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'CreatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_BulletinDaySection_CreatedById_To_User',
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

  @ManyToOne(() => User, (user: User) => user.updatedBulletinDaySections, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'UpdatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_BulletinDaySection_UpdatedById_To_User',
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
    nullable: true,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date;

  @Column({
    name: 'Settings',
    type: 'json',
    nullable: true,
  })
  public settings: Record<string, any> | null;

  /**
   * Gets the update model for the bulletin day section
   * @param content The new content
   * @param title The new title
   * @param order The new order
   * @returns Update model if changes detected, null otherwise
   */
  public getUpdateModel(
    content?: string | null,
    title?: string | null,
    order?: number,
  ): Partial<IUpdateBulletinDaySection> | null {
    const result: Partial<IUpdateBulletinDaySection> = {};
    let hasChanges = false;

    if (this.content !== content) {
      result.content = content;
      hasChanges = true;
    }

    if ((this.title ?? null) !== (title ?? null)) {
      result.title = title;
      hasChanges = true;
    }

    if (this.order !== order) {
      result.order = order;
      hasChanges = true;
    }

    return hasChanges ? result : null;
  }
}
