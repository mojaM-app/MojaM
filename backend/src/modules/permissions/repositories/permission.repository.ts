import { BaseRepository } from '@modules/common/base.repository';
import { SystemPermission } from '@modules/permissions/system-permission.enum';
import { UserSystemPermission } from '@prisma/client';
import { Service } from 'typedi';

@Service()
export class PermissionRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async getUserPermissions(userId: number): Promise<SystemPermission[]> {
    if (!userId) {
      return [];
    }

    const permissions = await this._dbContext.userSystemPermission.findMany({ where: { userId: userId } });

    return permissions.map(m => m.permissionId);
  }

  public async add(userId: number, permissionId: number, currentUserId: number): Promise<boolean> {
    const where = { userId_permissionId: { userId: userId, permissionId: permissionId } };

    const permission: UserSystemPermission = await this._dbContext.userSystemPermission.findUnique({
      where: where,
    });

    if (permission) {
      return true;
    }

    await this._dbContext.userSystemPermission.create({
      data: {
        user: {
          connect: { id: userId },
        },
        permission: {
          connect: { id: permissionId },
        },
        assignedAt: new Date(),
        assignedBy: {
          connect: { id: currentUserId },
        },
      },
    });

    return true;
  }

  public async delete(userId: number, permissionId?: number): Promise<boolean> {
    let where;
    if (permissionId) {
      where = { userId_permissionId: { userId: userId, permissionId: permissionId } };
    } else {
      where = { userId: userId };
    }

    const count: number = await this._dbContext.userSystemPermission.count({
      where: where,
    });

    if (count === 0) {
      return false;
    }

    await this._dbContext.userSystemPermission.delete({ where: where });
    return true;
  }
}
