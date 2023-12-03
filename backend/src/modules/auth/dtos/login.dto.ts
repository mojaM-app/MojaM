import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  public login: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  public password: string;
}
