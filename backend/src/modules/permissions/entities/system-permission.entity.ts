/* eslint-disable no-use-before-define */
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm';
import { UserSystemPermission } from './../../../modules/users/entities/user-system-permission.entity';

@Entity({
  name: 'system_permissions',
})
export class SystemPermission {
  @PrimaryColumn({
    name: 'Id',
    type: 'int',
  })
    id: number;

  @ManyToOne(() => SystemPermission, (systemPermission: SystemPermission) => systemPermission.children,
    { onDelete: 'RESTRICT', onUpdate: 'RESTRICT', })
  @JoinColumn({
    name: 'ParentId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_SystemPermission_ParentId',
  })
  @Column({
    name: 'ParentId',
    type: 'int',
    nullable: true,
  })
    parent: Relation<SystemPermission>;

  @Column({
    name: 'Name',
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
    name: string;

  @Column({
    name: 'Description',
    type: 'nvarchar',
    length: 255,
    nullable: false,
  })
    description: string;

  @OneToMany(() => SystemPermission, (systemPermission: SystemPermission) => systemPermission.parent)
    children: Relation<SystemPermission[]>;

  @OneToMany(() => UserSystemPermission, (userSystemPermission: UserSystemPermission) => userSystemPermission.user)
    users: Relation<UserSystemPermission[]>;
}
