import { PinService } from '@modules/auth';
import { isNullOrEmptyString } from '@utils';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsPinEmptyOrValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPinEmptyOrValid',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          if (isNullOrEmptyString(value)) {
            return true;
          }

          const service = new PinService();
          return service.isValid(value as string);
        },
      },
    });
  };
}
