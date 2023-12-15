import { BaseService } from '@modules/common/base.service';
import { UserSystemPermission } from '@prisma/client';
import { Guid } from 'guid-typescript';
import { Service } from 'typedi';

@Service()
export class PermissionService extends BaseService {
  public async add(userGuid: Guid, permissionId: number, currentUserId: number): Promise<boolean> {
    const userId: number = await this.getUserId(userGuid);
    if (!userId) {
      return false;
    }

    const where = { userId_permissionId: { userId: userId, permissionId: permissionId } };

    const permission: UserSystemPermission = await this._dbContext.userSystemPermission.findUnique({
      where: where,
    });
    if (permission) {
      return false;
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

  public async delete(userGuid: Guid, permissionId?: number): Promise<boolean> {
    const userId: number = await this.getUserId(userGuid);
    if (!userId) {
      return false;
    }

    let where;
    if (permissionId) {
      where = { userId_permissionId: { userId: userId, permissionId: permissionId } };
    } else {
      where = { userId: userId };
    }
    const permission: UserSystemPermission[] = await this._dbContext.userSystemPermission.findMany({
      where: where,
    });

    if (permission?.length > 0) {
      await this._dbContext.userSystemPermission.delete({ where: where });
      return true;
    }

    return false;
  }
}
