import { BaseRepository } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, SystemPermission } from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import { getUtcNow, isArrayEmpty, isEnumValue, isNullOrUndefined, isPositiveNumber } from '@utils';
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

    const permissions = await this._dbContext.userSystemPermissions
      .createQueryBuilder('u_to_p')
      .where('u_to_p.UserId = :userId', { userId })
      .select(['u_to_p.systemPermission'])
      .getMany();

    if (isArrayEmpty(permissions)) {
      return [];
    }

    return permissions.map(m => (m as any)?.systemPermission);
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || !isEnumValue(SystemPermission, reqDto.permissionId)) {
      return false;
    }

    const exists = await this._dbContext.userSystemPermissions
      .createQueryBuilder()
      .where('PermissionId = :permissionId', { permissionId: reqDto.permissionId })
      .andWhere('UserId = :userId', { userId })
      .getExists();

    if (exists) {
      return true;
    }

    await this._dbContext.userSystemPermissions.save({
      user: { id: userId },
      systemPermission: { id: reqDto.permissionId },
      assignedAt: getUtcNow(),
      assignedBy: { id: reqDto.currentUserId },
    });

    return true;
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) ||
      (!isNullOrUndefined(reqDto.permissionId) && !isEnumValue(SystemPermission, reqDto.permissionId))) {
      return false;
    }

    const queryBuilder = this._dbContext.userSystemPermissions
      .createQueryBuilder()
      .where('UserId = :userId', { userId });

    if (isEnumValue(SystemPermission, reqDto.permissionId)) {
      queryBuilder.andWhere('PermissionId = :permissionId', { permissionId: reqDto.permissionId });
    }

    const count = await queryBuilder.getCount();

    if (count === 0) {
      return true;
    }

    const deleteResult = await queryBuilder.delete().execute();
    return !isNullOrUndefined(deleteResult);
  }
}
