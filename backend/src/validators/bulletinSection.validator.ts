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
  public validate(value: unknown, args: ValidationArguments): boolean {
    const section = args.object as ICreateBulletinDaySection | IUpdateBulletinDaySection;
    const { type } = section;

    if (!isString(type)) {
      return false;
    }

    if (type === SectionType.CUSTOM_TEXT) {
      return Boolean(section.title?.length) && Boolean(section.content?.length);
    }

    // For section types (INTRODUCTION, TIPS_FOR_WORK, DAILY_PRAYER),
    // title and content should be null as they will be taken from Bulletin entity
    if ([SectionType.INTRODUCTION, SectionType.TIPS_FOR_WORK, SectionType.DAILY_PRAYER].includes(type as SectionType)) {
      return isNullOrUndefined(section.title) && isNullOrUndefined(section.content);
    }

    return false;
  }

  public defaultMessage(args: ValidationArguments): string {
    const section = args.object as ICreateBulletinDaySection | IUpdateBulletinDaySection;
    const { type } = section;

    if (!isString(type)) {
      return `IsBulletinSectionValidConstraint: Not supported args type ('${typeof args}').`;
    }

    if (type === SectionType.CUSTOM_TEXT) {
      if (!this.hasValue(section.title)) {
        return errorKeys.bulletin.Custom_Section_Title_Is_Required;
      } else if (!this.hasValue(section.content)) {
        return errorKeys.bulletin.Custom_Section_Content_Is_Required;
      }

      return '';
    }

    if (this.hasValue(section.title)) {
      return errorKeys.bulletin.Non_Custom_Section_Should_Not_Have_Title;
    }

    if (this.hasValue(section.content)) {
      return errorKeys.bulletin.Non_Custom_Section_Should_Not_Have_Content;
    }

    return 'IsBulletinSectionValidConstraint: not supported exception.';
  }

  private hasValue(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}

export function isBulletinSectionValid(validationOptions?: ValidationOptions) {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBulletinSectionValidConstraint,
    });
  };
}
