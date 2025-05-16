import { VALIDATOR_SETTINGS } from '@config';
import { testUtils } from '@helpers';
import { CreateUserDto } from '@modules/users';
import { generateRandomNumber, generateRandomPassword } from '@utils';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import 'reflect-metadata';

describe('user validator test', () => {
  describe('CreateUserDto validator test', () => {
    test('validation should be correct when EMAIL is valid', () => {
      const emails: string[] = [
        'email@domain.com',
        'email@domain.com',
        'firstname.lastname@domain.com',
        'email@subdomain.domain.com',
        'firstname+lastname@domain.com',
        '"email"@domain.com',
        '1234567890@domain.com',
        'email@domain-one.com',
        '_______@domain.com',
        'email@domain.name',
      ];
      for (const email of emails) {
        const user = { ...testUtils.generateValidUserWithPassword(), email } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when EMAIL is invalid', () => {
      const emails: string[] = [
        null as any,
        undefined as any,
        '',
        '  ',
        'invalid email',
        'email',
        'email.domain.com',
        'email@',
        '@domain.com',
        'email@domain',
        'email@domain.',
        'email @domain.com',
        'email@ domain.com',
        'dd@dd@domain.com',
        'a"b(c)d,e:f;g<h>i[jk]l@domain.com',
        'just"not"right@domain.com',
        'this is"notallowed@domain.com',
        'this\nisnotallowed@domain.com',
        'this\nis"notallowed@domain.com',
        '”(),:;<>[\\]@domain.com',
        '#@%^%#$@#$@#.com',
        'Joe Smith <JoeSmith@domain.com>',
        '.email@domain.com',
        'email.@domain.com',
        'email..email@domain.com',
        'JoeSmith@domain.com (Joe Smith)',
        'email@-domain.com',
        'email@.domain.com',
        'email@111.222.333.44444',
        'email@domain..com',
        'Abc..123@domain.com',
        'much.”more\\ unusual”@domain.com',
        'very.unusual.”@”.unusual.com@domain.com',
        'very.”(),:;<>[]”.VERY.”very@\\ "very”.unusual@strange.domain.com',
        'email@123.123.123.123',
        'email@[123.123.123.123]',
        'more_than_100_chars_email_looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong@domain.com',
      ];
      for (const email of emails) {
        const user = { ...testUtils.generateValidUserWithPassword(), email } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('email');
      }
    });

    test('validation should be correct when PHONE is valid', () => {
      const phones: string[] = [
        '221234567',
        '22 1234567',
        '+48 22 1234567',
        '+48 221234567',
        '+48221234567',
        '456123123',
        '456 123 456',
        '+48 456 456 456',
        '+48 456123456',
        '+48456123456',
        '+ 48456123123',
        '+ 48 456123123',
        '+ 48 456 123 456',
      ];
      for (const phone of phones) {
        const user = { ...testUtils.generateValidUserWithPassword(), phone } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when PHONE is invalid', () => {
      const phones: string[] = [
        null as any,
        undefined as any,
        '',
        '  ',
        'invalid phone',
        'phone',
        '1',
        '12',
        '123',
        '1234',
        '12345',
        '123456',
        '+22 1',
        '+48 22 1',
        '1234567890123456',
        '012345678',
        '+48012345678',
        '+48 012345678',
        '+48 012 345 678',
      ];
      for (const phone of phones) {
        const user = { ...testUtils.generateValidUserWithPassword(), phone } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('phone');
      }
    });

    test('validation should be correct when PASSWORD is valid', () => {
      const passwords: string[] = [
        null as any,
        undefined as any,
        '',
        'PaasssworD!',
        'PaasssworD@!',
        'Passwordd',
        'Passwordd1',
        'Passwordd!',
        'PaasssworD123@$',
        generateRandomPassword(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH),
      ];
      for (const password of passwords) {
        const user = { ...testUtils.generateValidUserWithPassword(), passcode: password } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when PASSWORD is invalid', () => {
      const passwords: string[] = ['paasssword', 'P@sswo2!', generateRandomPassword(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH + 1)];
      for (const password of passwords) {
        const user = { ...testUtils.generateValidUserWithPassword(), passcode: password } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('passcode');
      }
    });

    test('validation should be correct when PIN is valid', () => {
      const pins: string[] = [
        null as any,
        undefined as any,
        '',
        '1234',
        '12AB',
        'ABCD',
        'AbCd',
        '1abc',
        generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH),
      ];
      for (const pin of pins) {
        const user = { ...testUtils.generateValidUserWithPassword(), passcode: pin } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(0);
      }
    });

    test('validation should be incorrect when PIN is invalid', () => {
      const passwords: string[] = [
        '12345',
        1234 as any,
        generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH + 1),
        generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH - 1),
      ];
      for (const password of passwords) {
        const user = { ...testUtils.generateValidUserWithPassword(), passcode: password } satisfies CreateUserDto;
        const dto = plainToInstance(CreateUserDto, user);
        const validationResult: ValidationError[] = validateSync(dto);
        expect(validationResult.length).toBe(1);
        expect(validationResult[0].property).toBe('passcode');
      }
    });
  });
});
