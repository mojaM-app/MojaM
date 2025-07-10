import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'Id',
    primaryKeyConstraintName: 'PK_Log_Id',
  })
  public id!: number;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'CreatedAt',
    precision: 3,
    nullable: false,
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision3,
  })
  public createdAt!: Date;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'Level',
    nullable: false,
  })
  public level!: string;

  @Column({
    type: 'text',
    name: 'Message',
    nullable: false,
  })
  public message!: string;

  @Column({
    type: 'text',
    name: 'Meta',
    nullable: true,
  })
  public meta?: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'Source',
    nullable: true,
  })
  public source?: string;

  @Column({
    type: 'varchar',
    length: 45,
    name: 'IpAddress',
    nullable: true,
  })
  public ipAddress?: string;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'UserAgent',
    nullable: true,
  })
  public userAgent?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'Path',
    nullable: true,
  })
  public path?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'Method',
    nullable: true,
  })
  public method?: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'RequestId',
    nullable: true,
  })
  public requestId?: string;

  @Column({
    type: 'varchar',
    length: 36,
    name: 'UserId',
    nullable: true,
  })
  public userId: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'Severity',
    nullable: true,
  })
  public severity?: string;

  @Column({
    type: 'boolean',
    name: 'IsSecurityEvent',
    default: false,
  })
  public isSecurityEvent!: boolean;

  @Column({
    type: 'text',
    name: 'AdditionalData',
    nullable: true,
  })
  public additionalData?: string;
}
