import { isNullOrUndefined, isPositiveNumber } from '@/utils';
import { UserSystemPermission } from '@db/DbModels';
import { BaseRepository } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, SystemPermission } from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import Container, { Service } from 'typedi';

@Service()
export class PermissionsRepository extends BaseRepository {
  private readonly _userRepository: UsersRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
  }

  public async getUserPermissions(userId: number): Promise<SystemPermission[]> {
    if (!isPositiveNumber(userId)) {
      return [];
    }

    const permissions = await this._dbContext.userSystemPermission.findMany({ where: { userId } });

    return permissions.map(m => m.permissionId);
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || !isPositiveNumber(reqDto.permissionId)) {
      return false;
    }

    const where = { userId_permissionId: { userId: userId!, permissionId: reqDto.permissionId! } };

    const permission: UserSystemPermission | null = await this._dbContext.userSystemPermission.findUnique({
      where,
    });

    if (!isNullOrUndefined(permission)) {
      return true;
    }

    await this._dbContext.userSystemPermission.create({
      data: {
        user: {
          connect: { id: userId },
        },
        permission: {
          connect: { id: reqDto.permissionId },
        },
        assignedAt: new Date(),
        assignedBy: {
          connect: { id: reqDto.currentUserId },
        },
      },
    });

    return true;
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || (!isNullOrUndefined(reqDto.permissionId) && !isPositiveNumber(reqDto.permissionId))) {
      return false;
    }

    if (isPositiveNumber(reqDto.permissionId)) {
      const result = await this._dbContext.userSystemPermission.delete({
        where: {
          userId_permissionId: {
            userId: userId!,
            permissionId: reqDto.permissionId!,
          },
        },
      });
    } else {
      const result = await this._dbContext.user.update({
        where: {
          id: userId,
        },
        data: {
          systemPermissions: {
            deleteMany: {},
          },
        },
        include: {
          systemPermissions: true,
        },
      });
    }

    return true;
  }
}
