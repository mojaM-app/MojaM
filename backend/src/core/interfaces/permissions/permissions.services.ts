import { type IUserEntity } from '../users/IUserEntity';

export interface IPermissionsService {
  getUserPermissions: (user: IUserEntity | null | undefined) => Promise<number[]>;
}
