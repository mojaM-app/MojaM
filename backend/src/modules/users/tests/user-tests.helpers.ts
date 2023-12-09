import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword, generateRandomString } from '@utils/tests.utils';

const generateValidUser = (): CreateUserDto => {
  return <CreateUserDto>{
    email: generateRandomEmail(),
    password: generateRandomPassword(),
    phone: generateRandomNumber(9),
    firstName: generateRandomString(10),
  };
};

export { generateValidUser };
