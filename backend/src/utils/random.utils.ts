import './date.extensions';
import { getDateNow } from './date.utils';

const allowed = {
  uppers: 'QWERTYUIOPASDFGHJKLZXCVBNM',
  lowers: 'qwertyuiopasdfghjklzxcvbnm',
  numbers: '1234567890',
  symbols: '!@#$%^&*',
};

export const getRandomCharFromString = (str: string): string => str.charAt(Math.floor(Math.random() * str.length));

export const generateRandomPassword = (length: number = 10): string => {
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

export const generateRandomString = (length: number = 8): string => {
  let pwd = '';
  pwd += getRandomCharFromString(allowed.lowers);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(allowed.lowers);
  }
  pwd += getRandomCharFromString(allowed.numbers);
  return pwd;
};

export const generateRandomEmail = (length: number = 8): string => {
  return `${generateRandomString(length)}@email.com`;
};

export const generateRandomNumber = (length: number = 9): string => {
  let pwd = getRandomCharFromString(allowed.numbers);
  for (let i = pwd.length; i < length; i++) {
    pwd += getRandomCharFromString(allowed.numbers);
  }
  return pwd;
};

export const generateRandomInteger = (min: number, max: number): number => {
  return Math.floor(min + Math.random() * (max - min + 1));
};

export const generateRandomDate = (): Date => {
  const day = generateRandomInteger(-30, 30);
  return getDateNow().addDays(day);
};
