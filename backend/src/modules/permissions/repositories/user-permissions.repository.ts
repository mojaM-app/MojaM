import { BaseRepository } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, PermissionsCacheService, SystemPermissions } from '@modules/permissions';
import { UserRepository } from '@modules/users';
import { User } from '@modules/users/entities/user.entity';
import { IAddUserSystemPermission } from '@modules/users/interfaces/add-user-system-permission.interfaces';
import { getDateTimeNow, isArrayEmpty, isEnumValue, isNullOrUndefined, isPositiveNumber } from '@utils';
import Container, { Service } from 'typedi';

@Service()
export class UserPermissionsRepository extends BaseRepository {
  private readonly _userRepository: UserRepository;
  private readonly _permissionsCacheService: PermissionsCacheService;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._permissionsCacheService = Container.get(PermissionsCacheService);
  }

  public async get(user: User | null | undefined): Promise<SystemPermissions[]> {
    if (isNullOrUndefined(user)) {
      return [];
    }

    const permissionsByUserAttr = await this.getByAttributes(user);

    const cachedPermissions = await this._permissionsCacheService.readAsync(user!.id);
    if (!isNullOrUndefined(cachedPermissions)) {
      return Array.from(new Set([...cachedPermissions!, ...permissionsByUserAttr]));
    }

    const systemPermissions = await this._dbContext.userSystemPermissions
      .createQueryBuilder('u_to_p')
      .innerJoinAndSelect('u_to_p.systemPermission', 'systemPermission')
      .where('u_to_p.UserId = :userId', { userId: user!.id })
      .getMany();

    const permissions = isArrayEmpty(systemPermissions) ? [] : systemPermissions.map(m => m.systemPermission.id);

    const result = Array.from(new Set([...permissions, ...permissionsByUserAttr]));

    await this._permissionsCacheService.saveAsync(user!.id, result);

    return result;
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || !isEnumValue(SystemPermissions, reqDto.permissionId)) {
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
      user: { id: userId! },
      systemPermission: { id: reqDto.permissionId! },
      assignedAt: getDateTimeNow(),
      assignedBy: { id: reqDto.currentUserId! },
    } satisfies IAddUserSystemPermission);

    await this._permissionsCacheService.removeAsync(userId!);

    return true;
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    const userId = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!isPositiveNumber(userId) || (!isNullOrUndefined(reqDto.permissionId) && !isEnumValue(SystemPermissions, reqDto.permissionId))) {
      return false;
    }

    const queryBuilder = this._dbContext.userSystemPermissions.createQueryBuilder().where('UserId = :userId', { userId });

    if (isEnumValue(SystemPermissions, reqDto.permissionId)) {
      queryBuilder.andWhere('PermissionId = :permissionId', { permissionId: reqDto.permissionId });
    }

    const count = await queryBuilder.getCount();

    if (count === 0) {
      return true;
    }

    const deleteResult = await queryBuilder.delete().execute();

    await this._permissionsCacheService.removeAsync(userId!);

    return !isNullOrUndefined(deleteResult);
  }

  public async getByAttributes(user: User | null | undefined): Promise<SystemPermissions[]> {
    if (user?.isAdmin() === true) {
      return this.getAllPermissions();
    }

    return [];
  }

  private getAllPermissions(): SystemPermissions[] {
    return (Object.values(SystemPermissions).filter(value => typeof value === 'number') as number[]).map(m => m as SystemPermissions);
  }
}
