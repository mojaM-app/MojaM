import { getDateNow } from './date.utils';

const allowed = {
  uppers: 'QWERTYUIOPASDFGHJKLZXCVBNM',
  lowers: 'qwertyuiopasdfghjklzxcvbnm',
  numbers: '1234567890',
  symbols: '!@#$%^&*',
};

const getRandomCharFromString = (str: string): string => str.charAt(Math.floor(Math.random() * str.length));

const generateRandomPassword = (length: number = 10): string => {
  let pwd = '';
  pwd += getRandomCharFromString(allowed.uppers);
  pwd += getRandomCharFromString(allowed.lowers);
  pwd += getRandomCharFromString(allowed.numbers);
  pwd += getRandomCharFromString(allowed.symbols);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(Object.values(allowed).join(''));
  }
  return pwd;
};

const generateRandomString = (length: number = 8): string => {
  let pwd = '';
  pwd += getRandomCharFromString(allowed.lowers);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(allowed.lowers);
  }
  pwd += getRandomCharFromString(allowed.numbers);
  return pwd;
};

const generateRandomEmail = (length: number = 8): string => {
  return `${generateRandomString(length)}@email.com`;
};

const generateRandomNumber = (length: number = 9): string => {
  let pwd = getRandomCharFromString(allowed.numbers);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(allowed.numbers);
  }
  return pwd;
};

const generateRandomDate = (): Date => {
  const from = getDateNow();
  const month = from.getMonth();
  from.setMonth(month - 1);
  from.setHours(0, 0, 0, 0);

  const to = getDateNow();
  to.setMonth(month + 1);
  from.setHours(0, 0, 0, 0);

  const fromTime = from.getTime();
  const toTime = to.getTime();
  const randomDate = new Date(fromTime + Math.random() * (toTime - fromTime));
  return new Date(randomDate.getFullYear(), randomDate.getMonth(), randomDate.getDate());
};

const getAdminLoginData = (): { uuid: string; email: string; phone: string; password: string } => {
  return {
    uuid: '2eaa394a-649d-44c1-b797-4a9e4ed2f836',
    email: 'admin@domain.com',
    phone: '123456789',
    password: 'P@ssWord!1',
  };
};

export { generateRandomDate, generateRandomEmail, generateRandomNumber, generateRandomPassword, generateRandomString, getAdminLoginData };
