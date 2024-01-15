import { BaseService } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, PermissionsRepository } from '@modules/permissions';
import { isGuid, isNullOrUndefined, isPositiveNumber } from '@utils';
import { Container, Service } from 'typedi';

@Service()
export class PermissionsService extends BaseService {
  private readonly _permissionRepository: PermissionsRepository;

  public constructor() {
    super();
    this._permissionRepository = Container.get(PermissionsRepository);
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid) || !isPositiveNumber(reqDto.permissionId)) {
      return false;
    }

    return await this._permissionRepository.add(reqDto);
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid) || (!isNullOrUndefined(reqDto.permissionId) && !isPositiveNumber(reqDto.permissionId))) {
      return false;
    }

    return await this._permissionRepository.delete(reqDto);
  }
}
