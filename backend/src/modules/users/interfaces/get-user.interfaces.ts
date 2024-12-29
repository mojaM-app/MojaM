export interface IGetUserDto {
  id: string;
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  joiningDate: Date | null;
}
