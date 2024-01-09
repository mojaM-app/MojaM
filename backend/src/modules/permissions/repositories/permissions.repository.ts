import { UserSystemPermission } from '@db/DbModels';
import { BaseRepository } from '@modules/common';
import { AddPermissionPayload, DeletePermissionsPayload, SystemPermission } from '@modules/permissions';
import { Service } from 'typedi';

@Service()
export class PermissionsRepository extends BaseRepository {
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

  public async add(payload: AddPermissionPayload): Promise<boolean> {
    const where = { userId_permissionId: { userId: payload.userId, permissionId: payload.permissionId } };

    const permission: UserSystemPermission = await this._dbContext.userSystemPermission.findUnique({
      where: where,
    });

    if (permission) {
      return true;
    }

    await this._dbContext.userSystemPermission.create({
      data: {
        user: {
          connect: { id: payload.userId },
        },
        permission: {
          connect: { id: payload.permissionId },
        },
        assignedAt: new Date(),
        assignedBy: {
          connect: { id: payload.currentUserId },
        },
      },
    });

    return true;
  }

  public async delete(payload: DeletePermissionsPayload): Promise<boolean> {
    let where;
    if (payload.permissionId) {
      where = { userId_permissionId: { userId: payload.userId, permissionId: payload.permissionId } };
    } else {
      where = { userId: payload.userId };
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
