import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { IAddUserSystemPermission } from '@core';
import { User } from './user.entity';
import { EntityDefaultFunctions } from '../../EntityDefaultFunctions';
import { SystemPermission } from '../permissions/system-permission.entity';

@Entity({
  name: 'user_to_systempermissions',
})
export class UserSystemPermission implements IAddUserSystemPermission {
  @ManyToOne(() => User, (user: User) => user.systemPermissions, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_UserSystemPermission_UserId_To_User',
  })
  @PrimaryColumn({
    name: 'UserId',
    type: 'int',
    nullable: false,
  })
  public user: Relation<User>;

  @ManyToOne(() => SystemPermission, (systemPermission: SystemPermission) => systemPermission.users, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'PermissionId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_UserSystemPermission_To_SystemPermission',
  })
  @PrimaryColumn({
    name: 'PermissionId',
    type: 'int',
    nullable: false,
  })
  public systemPermission: Relation<SystemPermission>;

  @ManyToOne(() => User, (user: User) => user.assignedSystemPermissions, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({
    name: 'AssignedById',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_UserSystemPermission_AssignedById_To_User',
  })
  @Column({
    name: 'AssignedById',
    type: 'int',
    nullable: false,
  })
  public assignedBy: Relation<User>;

  @CreateDateColumn({
    name: 'AssignedAt',
    nullable: false,
    precision: 0,
    default: EntityDefaultFunctions.defaultCurrentTimestampPrecision0,
    type: 'timestamp',
  })
  public assignedAt: Date;
}
