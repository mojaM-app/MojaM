import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword, generateRandomString } from '@utils/tests.utils';

const generateValidUser = (): CreateUserDto => {
  return <CreateUserDto>{
    email: generateRandomEmail(),
    password: generateRandomPassword(),
    phone: '88' + generateRandomNumber(7),
    firstName: generateRandomString(10),
  };
};

export { generateValidUser };
