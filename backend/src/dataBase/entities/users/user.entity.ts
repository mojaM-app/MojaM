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
import { IUserDto } from '@core';
import { UserResetPasscodeToken } from './user-reset-passcode-tokens.entity';
import { UserSystemPermission } from './user-system-permission.entity';
import { ICreateUser, IHasGuidId, IUpdateUser, IUserEntity } from '../../../core/interfaces';
import { getAdminLoginData } from '../../../utils/user.utils';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { EntityTransformFunctions } from '../../EntityTransformFunctions';
import { AnnouncementItem } from '../announcements/announcement-item.entity';
import { Announcement } from '../announcements/announcement.entity';

@Unique('UQ_User_Email_Phone', ['email', 'phone'])
@Entity({
  name: 'users',
})
export class User implements IHasGuidId, ICreateUser, IUpdateUser, IUserEntity {
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
    name: 'Passcode',
    type: 'nvarchar',
    length: 256,
    nullable: true,
  })
  public passcode: string | null;

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
  public firstName?: string | null;

  @Column({
    name: 'LastName',
    type: 'nvarchar',
    length: 255,
    nullable: true,
  })
  public lastName?: string | null;

  @Column({
    name: 'JoiningDate',
    type: 'date',
    nullable: true,
    transformer: {
      from: EntityTransformFunctions.stringDateToDate,
      to: EntityTransformFunctions.dateToStringDate,
    },
  })
  public joiningDate: Date | null;

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
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
  })
  public createdAt: Date;

  @UpdateDateColumn({
    name: 'UpdatedAt',
    precision: 0,
    nullable: true,
    type: 'timestamp',
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  @Column({
    name: 'LastLoginAt',
    type: 'timestamp',
    nullable: true,
  })
  public lastLoginAt: Date | null;

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

  @OneToMany(() => UserSystemPermission, (permissions: UserSystemPermission) => permissions.user)
  public systemPermissions: Relation<UserSystemPermission[]>;

  @OneToMany(() => UserSystemPermission, (permissions: UserSystemPermission) => permissions.assignedBy)
  public assignedSystemPermissions: Relation<UserSystemPermission[]>;

  @OneToOne(() => UserResetPasscodeToken, (token: UserResetPasscodeToken) => token.user)
  public resetPasscodeToken: Relation<UserResetPasscodeToken>;

  @OneToMany(() => Announcement, (announcements: Announcement) => announcements.createdBy)
  public createdAnnouncements: Relation<Announcement[]>;

  @OneToMany(() => Announcement, (announcements: Announcement) => announcements.publishedBy)
  public publishedAnnouncements: Relation<Announcement[]>;

  @OneToMany(() => AnnouncementItem, (announcementItem: AnnouncementItem) => announcementItem.createdBy)
  public createdAnnouncementItems: Relation<AnnouncementItem[]>;

  @OneToMany(() => AnnouncementItem, (announcementItem: AnnouncementItem) => announcementItem.updatedBy)
  public updatedAnnouncementItems: Relation<AnnouncementItem[]>;

  public getFirstLastName(): string | null {
    if ((this.firstName?.length ?? 0) > 0 && (this.lastName?.length ?? 0) > 0) {
      return `${this.firstName} ${this.lastName}`;
    } else if ((this.firstName?.length ?? 0) > 0) {
      return this.firstName!;
    } else if ((this.lastName?.length ?? 0) > 0) {
      return this.lastName!;
    }
    return null;
  }

  public getFirstLastNameOrEmail(): string {
    return this.getFirstLastName() ?? this.email;
  }

  public getLastFirstName(): string | null {
    if ((this.lastName?.length ?? 0) > 0 && (this.firstName?.length ?? 0) > 0) {
      return `${this.lastName} ${this.firstName}`;
    } else if ((this.lastName?.length ?? 0) > 0) {
      return this.lastName!;
    } else if ((this.firstName?.length ?? 0) > 0) {
      return this.firstName!;
    }
    return null;
  }

  public getLastFirstNameOrEmail(): string {
    return this.getLastFirstName() ?? this.email;
  }

  public isAdmin(): boolean {
    return this.uuid === getAdminLoginData().uuid;
  }

  public isPasscodeSet(): boolean {
    return (this.passcode?.length ?? 0) > 0;
  }
}

export function userToIUser(user: IUserEntity): IUserDto {
  return {
    id: user.uuid,
    email: user.email,
    phone: user.phone,
  } satisfies IUserDto;
}
