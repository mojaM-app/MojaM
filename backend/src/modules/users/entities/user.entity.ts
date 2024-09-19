import { Column, CreateDateColumn, Entity, Generated, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation, Unique, UpdateDateColumn } from 'typeorm';
import { UserResetPasswordToken } from './../../auth/entities/user-reset-password-tokens.entity';
import { UserSystemPermission } from './user-system-permission.entity';

@Unique('UQ_User_Email_Phone', ['email', 'phone'])
@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn('increment', {
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_User_Id',
  })
    id: number;

  @Column({
    name: 'Uuid',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Unique('UQ_User_Uuid', ['uuid'])
  @Generated('uuid')
    uuid: string;

  @Column({
    name: 'Email',
    type: 'nvarchar',
    length: 320,
    nullable: false,
  })
    email: string;

  @Column({
    name: 'EmailConfirmed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
    emailConfirmed: boolean;

  @Column({
    name: 'Phone',
    type: 'nvarchar',
    length: 30,
    nullable: false,
  })
    phone: string;

  @Column({
    name: 'PhoneConfirmed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
    phoneConfirmed: boolean;

  @Column({
    name: 'Password',
    type: 'nvarchar',
    length: 1024,
    nullable: true,
  })
    password: string | null;

  @Column({
    name: 'Salt',
    type: 'nvarchar',
    length: 64,
    nullable: false,
  })
    salt: string;

  @Column({
    name: 'RefreshTokenKey',
    type: 'nvarchar',
    length: 128,
    nullable: false,
  })
    refreshTokenKey: string;

  @Column({
    name: 'FirstName',
    type: 'nvarchar',
    length: 255,
    nullable: true,
  })
    firstName?: string;

  @Column({
    name: 'LastName',
    type: 'nvarchar',
    length: 255,
    nullable: true,
  })
    lastName?: string;

  @Column({
    name: 'BirthDay',
    type: 'date',
    nullable: true,
  })
    birthDay?: Date;

  @Column({
    name: 'JoiningYear',
    type: 'date',
    nullable: true,
  })
    joiningYear?: Date;

  @Column({
    name: 'IsActive',
    type: 'boolean',
    nullable: false,
    default: false,
  })
    isActive: boolean;

  @CreateDateColumn({
    name: 'CreatedAt',
    precision: 0,
    nullable: false,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
    createdAt: Date;

  @UpdateDateColumn({
    name: 'UpdatedAt',
    precision: 0,
    nullable: true,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
    updatedAt?: Date;

  @Column({
    name: 'LastLoginAt',
    type: 'timestamp',
    nullable: true,
  })
    lastLoginAt?: Date;

  @Column({
    name: 'FailedLoginAttempts',
    type: 'int',
    nullable: false,
    default: 0,
  })
    failedLoginAttempts: number;

  @Column({
    name: 'IsLockedOut',
    type: 'boolean',
    nullable: false,
    default: false,
  })
    isLockedOut: boolean;

  @Column({
    name: 'IsDeleted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
    isDeleted: boolean;

  @OneToMany(() => UserSystemPermission, (permissions: UserSystemPermission) => permissions.user)
    systemPermissions: Relation<UserSystemPermission[]>;

  @OneToMany(() => UserSystemPermission, (assignedPermissions: UserSystemPermission) => assignedPermissions.assignedBy)
    assignedSystemPermissions: Relation<UserSystemPermission[]>;

  @OneToOne(() => UserResetPasswordToken, (token: UserResetPasswordToken) => token.user)
    resetPasswordToken: Relation<UserResetPasswordToken>;
}
