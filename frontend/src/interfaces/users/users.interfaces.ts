import { GridData } from "../common/grid.data";

export interface IUserGridItemDto {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

export type UsersGridData = GridData<IUserGridItemDto>;
