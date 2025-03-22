import { PasswordService } from '@modules/auth';
import { isNullOrEmptyString } from '@utils';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsPasswordEmptyOrValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPasswordEmptyOrValid',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          if (isNullOrEmptyString(value)) {
            return true;
          }

          const service = new PasswordService();
          return service.isValid(value as string);
        },
      },
    });
  };
}
