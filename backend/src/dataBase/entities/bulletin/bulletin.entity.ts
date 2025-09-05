import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BulletinState } from '../../../modules/bulletin/enums/bulletin-state.enum';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { EntityTransformFunctions } from '../../EntityTransformFunctions';
import { User } from '../users/user.entity';
import { IBulletinEntity, ICreateBulletin, IUpdateBulletin } from './../../../core/interfaces';
import { BulletinDay } from './bulletin-day.entity';

@Entity({
  name: 'bulletins',
})
export class Bulletin implements IBulletinEntity, ICreateBulletin, IUpdateBulletin {
  public static readonly typeName = 'Bulletin' as const;

  @PrimaryGeneratedColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_Bulletin_Id',
  })
  public id!: number;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_Bulletin_Uuid', ['uuid'])
  @Generated('uuid')
  public uuid!: string;

  @Column({
    name: 'State',
    type: 'tinyint',
    nullable: false,
    default: BulletinState.Draft,
  })
  public state!: BulletinState;

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
  @Unique('UQ_Bulletin_Date', ['date'])
  public date: Date | null = null;

  @Column({
    name: 'Number',
    type: 'int',
    nullable: true,
  })
  public number: number | null = null;

  @Index('IX_Bulletin_Introduction_Fulltext', { fulltext: true })
  @Column({
    name: 'Introduction',
    type: 'text',
    nullable: true,
  })
  public introduction: string | null = null;

  @Index('IX_Bulletin_TipsForWork_Fulltext', { fulltext: true })
  @Column({
    name: 'TipsForWork',
    type: 'text',
    nullable: true,
  })
  public tipsForWork: string | null = null;

  @Index('IX_Bulletin_DailyPrayer_Fulltext', { fulltext: true })
  @Column({
    name: 'DailyPrayer',
    type: 'text',
    nullable: true,
  })
  public dailyPrayer: string | null = null;

  @ManyToOne(() => User, (user: User) => user.createdBulletins, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'CreatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Bulletin_CreatedById_To_User',
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

  @ManyToOne(() => User, (user: User) => user.updatedBulletins, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UpdatedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Bulletin_UpdatedById_To_User',
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

  @ManyToOne(() => User, (user: User) => user.publishedBulletins, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'PublishedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Bulletin_PublishedById_To_User',
  })
  @Column({
    name: 'PublishedById',
    type: 'int',
    nullable: true,
  })
  public publishedBy: Relation<User> | null = null;

  @Column({
    name: 'PublishedAt',
    precision: 0,
    type: 'timestamp',
    nullable: true,
  })
  public publishedAt: Date | null = null;

  @OneToMany(() => BulletinDay, (day: BulletinDay) => day.bulletin, { cascade: true })
  public days!: Relation<BulletinDay[]>;

  public get isPublished(): boolean {
    return this.state === BulletinState.Published;
  }

  public get isDraft(): boolean {
    return this.state === BulletinState.Draft;
  }

  /**
   * Gets the update model for the bulletin
   * @param updates The updates to apply
   * @returns Update model if changes detected, null otherwise
   */
  public getUpdateModel(updates: {
    title?: string | null;
    date?: Date | null;
    number?: number | null;
    introduction?: string | null;
    tipsForWork?: string | null;
    dailyPrayer?: string | null;
  }): QueryDeepPartialEntity<IUpdateBulletin> | null {
    const result: QueryDeepPartialEntity<IUpdateBulletin> = {};
    let wasChanged = false;

    if ((this.title ?? null) !== (updates.title ?? null)) {
      result.title = updates.title;
      wasChanged = true;
    }

    if ((this.date ?? null) !== (updates.date ?? null)) {
      result.date = updates.date;
      wasChanged = true;
    }

    if ((this.number ?? null) !== (updates.number ?? null)) {
      result.number = updates.number;
      wasChanged = true;
    }

    if ((this.introduction ?? null) !== (updates.introduction ?? null)) {
      result.introduction = updates.introduction;
      wasChanged = true;
    }

    if ((this.tipsForWork ?? null) !== (updates.tipsForWork ?? null)) {
      result.tipsForWork = updates.tipsForWork;
      wasChanged = true;
    }

    if ((this.dailyPrayer ?? null) !== (updates.dailyPrayer ?? null)) {
      result.dailyPrayer = updates.dailyPrayer;
      wasChanged = true;
    }

    return wasChanged ? result : null;
  }
}
