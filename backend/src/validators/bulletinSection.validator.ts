import { ICreateBulletinDaySection, IUpdateBulletinDaySection } from '@core';
import { errorKeys } from '@exceptions';
import { isNullOrUndefined, isString } from '@utils';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { SectionType } from '../modules/bulletin/enums/bulletin-section-type.enum';

@ValidatorConstraint({ name: 'isBulletinSectionValid', async: false })
export class IsBulletinSectionValidConstraint implements ValidatorConstraintInterface {
  public validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as ICreateBulletinDaySection | IUpdateBulletinDaySection;

    if (!object || !object.type) {
      return false;
    }

    // For CUSTOM_TEXT sections, title and content are required
    if (object.type === SectionType.CUSTOM_TEXT) {
      return (object?.title?.length ?? 0) > 0 && (object?.content?.length ?? 0) > 0;
    }

    // For other section types (INTRODUCTION, TIPS_FOR_WORK, DAILY_PRAYER),
    // title and content should be null as they will be taken from Bulletin entity
    if (
      object.type === SectionType.INTRODUCTION ||
      object.type === SectionType.TIPS_FOR_WORK ||
      object.type === SectionType.DAILY_PRAYER
    ) {
      return isNullOrUndefined(object.title) && isNullOrUndefined(object.content);
    }

    return false;
  }

  public defaultMessage(args: ValidationArguments): string {
    const object = args.object as ICreateBulletinDaySection | IUpdateBulletinDaySection;

    if (!object || !object.type) {
      return `IsBulletinSectionValidConstraint: Not supported args type ('${typeof args}').`;
    }

    if (object.type === SectionType.CUSTOM_TEXT) {
      if (isNullOrUndefined(object.title) || !isString(object.title) || object.title!.length === 0) {
        return errorKeys.bulletin.Custom_Section_Title_Is_Required;
      }
      if (isNullOrUndefined(object.content) || !isString(object.content) || object.content!.length === 0) {
        return errorKeys.bulletin.Custom_Section_Content_Is_Required;
      }
    } else {
      if (object.title) {
        return errorKeys.bulletin.Non_Custom_Section_Should_Not_Have_Title;
      } else if (object.content) {
        return errorKeys.bulletin.Non_Custom_Section_Should_Not_Have_Content;
      }
    }

    return 'IsBulletinSectionValidConstraint: not supported exception.';
  }
}

export function IsBulletinSectionValid(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBulletinSectionValidConstraint,
    });
  };
}
