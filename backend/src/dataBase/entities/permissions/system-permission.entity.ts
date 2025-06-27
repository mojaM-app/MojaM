import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Relation } from 'typeorm';
import { UserSystemPermission } from '../users/user-system-permission.entity';

@Entity({
  name: 'system_permissions',
})
export class SystemPermission {
  @PrimaryColumn({
    name: 'Id',
    type: 'int',
    primaryKeyConstraintName: 'PK_SystemPermission_Id',
  })
  public id: number;

  @ManyToOne(() => SystemPermission, (systemPermission: SystemPermission) => systemPermission.children, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'ParentId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_SystemPermission_ParentId_To_SystemPermission',
  })
  @Column({
    name: 'ParentId',
    type: 'int',
    nullable: true,
  })
  public parent: Relation<SystemPermission>;

  @Column({
    name: 'Name',
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  public name: string;

  @Column({
    name: 'Description',
    type: 'nvarchar',
    length: 255,
    nullable: false,
  })
  public description: string;

  @OneToMany(() => SystemPermission, (systemPermission: SystemPermission) => systemPermission.parent)
  public children: Relation<SystemPermission[]>;

  @OneToMany(() => UserSystemPermission, (userSystemPermission: UserSystemPermission) => userSystemPermission.user)
  public users: Relation<UserSystemPermission[]>;
}
