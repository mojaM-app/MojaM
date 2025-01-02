export abstract class UserDto {
  public email!: string;
  public phone!: string;
  public firstName?: string | null;
  public lastName?: string | null;
  public joiningDate?: Date | null;
}
