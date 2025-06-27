import { VALIDATOR_SETTINGS } from '@config';
import { type IUser } from '@core';
import { generateRandomEmail, generateRandomNumber, generateRandomPassword } from '../../../utils/random.utils';
import { type CreateUserDto } from '../dtos/create-user.dto';

const generateValidUser = (): IUser => {
  const phoneNumberCount = VALIDATOR_SETTINGS.PHONE_MAX_LENGTH - 2; // 2 for the country code '88'
  return {
    email: generateRandomEmail(),
    phone: `88${generateRandomNumber(phoneNumberCount)}`,
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
