import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ICreateUser } from '../interfaces/create-user.interfaces';
import { IUserId } from '../interfaces/IUser.Id';
import { IHasGuidId } from './../../../interfaces/IHasGuidId';
import { AnnouncementItem } from './../../../modules/announcements/entities/announcement-item.entity';
import { Announcement } from './../../../modules/announcements/entities/announcement.entity';
import { UserResetPasswordToken } from './../../auth/entities/user-reset-password-tokens.entity';
import { UserSystemPermission } from './user-system-permission.entity';

@Unique('UQ_User_Email_Phone', ['email', 'phone'])
@Entity({
  name: 'users',
})
export class User implements IHasGuidId, IUserId, ICreateUser {
  @PrimaryGeneratedColumn('increment', {
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_User_Id',
  })
  public id: number;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_User_Uuid', ['uuid'])
  @Generated('uuid')
  public uuid: string;

  @Column({
    name: 'Email',
    type: 'nvarchar',
    length: 320,
    nullable: false,
  })
  public email: string;

  @Column({
    name: 'EmailConfirmed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public emailConfirmed: boolean;

  @Column({
    name: 'Phone',
    type: 'nvarchar',
    length: 30,
    nullable: false,
  })
  public phone: string;

  @Column({
    name: 'PhoneConfirmed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public phoneConfirmed: boolean;

  @Column({
    name: 'Password',
    type: 'nvarchar',
    length: 1024,
    nullable: true,
  })
  public password: string | null;

  @Column({
    name: 'Salt',
    type: 'nvarchar',
    length: 64,
    nullable: false,
  })
  public salt: string;

  @Column({
    name: 'RefreshTokenKey',
    type: 'nvarchar',
    length: 128,
    nullable: false,
  })
  public refreshTokenKey: string;

  @Column({
    name: 'FirstName',
    type: 'nvarchar',
    length: 255,
    nullable: true,
  })
  public firstName?: string;

  @Column({
    name: 'LastName',
    type: 'nvarchar',
    length: 255,
    nullable: true,
  })
  public lastName?: string;

  @Column({
    name: 'JoiningDate',
    type: 'date',
    nullable: true,
  })
  public joiningDate?: Date;

  @Column({
    name: 'IsActive',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public isActive: boolean;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    name: 'UpdatedAt',
    precision: 0,
    nullable: true,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt?: Date;

  @Column({
    name: 'LastLoginAt',
    type: 'timestamp',
    nullable: true,
  })
  public lastLoginAt?: Date;

  @Column({
    name: 'FailedLoginAttempts',
    type: 'int',
    nullable: false,
    default: 0,
  })
  public failedLoginAttempts: number;

  @Column({
    name: 'IsLockedOut',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public isLockedOut: boolean;

  @Column({
    name: 'IsDeleted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public isDeleted: boolean;

  @OneToMany(() => UserSystemPermission, (permissions: UserSystemPermission) => permissions.user)
  public systemPermissions: Relation<UserSystemPermission[]>;

  @OneToMany(() => UserSystemPermission, (permissions: UserSystemPermission) => permissions.assignedBy)
  public assignedSystemPermissions: Relation<UserSystemPermission[]>;

  @OneToOne(() => UserResetPasswordToken, (token: UserResetPasswordToken) => token.user)
  public resetPasswordToken: Relation<UserResetPasswordToken>;

  @OneToMany(() => Announcement, (announcements: Announcement) => announcements.createdBy)
  public createdAnnouncements: Relation<Announcement[]>;

  @OneToMany(() => Announcement, (announcements: Announcement) => announcements.publishedBy)
  public publishedAnnouncements: Relation<Announcement[]>;

  @OneToMany(() => AnnouncementItem, (announcementItem: AnnouncementItem) => announcementItem.createdBy)
  public createdAnnouncementItems: Relation<AnnouncementItem[]>;

  @OneToMany(() => AnnouncementItem, (announcementItem: AnnouncementItem) => announcementItem.updatedBy)
  public updatedAnnouncementItems: Relation<AnnouncementItem[]>;

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
