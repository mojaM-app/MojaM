import { PasswordService, PinService } from '@/modules/auth';
import { isNullOrUndefined } from '@utils';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Check if both password and pin are valid
 */
export function IsPasswordOrPinValid(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'isPasswordOrPinValid',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (isNullOrUndefined(value)) {
            return false;
          }

          const isPasswordValid = new PasswordService().isValid(value as string);
          const isPinValid = new PinService().isValid(value as string);
          return isPasswordValid || isPinValid;
        },
      },
    });
  };
}
