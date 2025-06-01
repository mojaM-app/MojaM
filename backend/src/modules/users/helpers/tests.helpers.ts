import { VALIDATOR_SETTINGS } from '@config';
import { IUser } from '@core';
import { CreateUserDto } from '../dtos/create-user.dto';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword } from './../../../utils/random.utils';

const generateValidUser = (): any => {
  return {
    email: generateRandomEmail(),
    phone: '88' + generateRandomNumber(7),
    getFirstLastName: () => 'John Doe',
    getFirstLastNameOrEmail: () => 'John Doe',
    getLastFirstName: () => 'Doe John',
    getLastFirstNameOrEmail: () => 'Doe John',
    isAdmin: () => true,
  };
};

export const generateValidUserWithPassword = (): CreateUserDto & IUser => {
  return {
    ...generateValidUser(),
    passcode: generateRandomPassword(),
  } satisfies CreateUserDto & IUser;
};

export const generateValidUserWithPin = (): CreateUserDto & IUser => {
  return {
    ...generateValidUser(),
    passcode: generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH),
  } satisfies CreateUserDto & IUser;
};
