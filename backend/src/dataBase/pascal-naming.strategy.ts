import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { titleCase } from 'typeorm/util/StringUtils';

export class TitleCaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface {
  tableName(className: string, customName: string): string {
    return customName || titleCase(className);
  }

  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    return (
      titleCase(embeddedPrefixes.concat('').join('_')) +
      (customName || titleCase(propertyName))
    );
  }

  relationName(propertyName: string): string {
    return titleCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return titleCase(relationName + '_' + referencedColumnName);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    secondPropertyName: string,
  ): string {
    return titleCase(
      firstTableName +
        '_' +
        firstPropertyName.replace(/\./gi, '_') +
        '_' +
        secondTableName,
    );
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return titleCase(
      tableName + '_' + (columnName || propertyName),
    );
  }

  classTableInheritanceParentColumnName(
    parentTableName: any,
    parentTableIdPropertyName: any,
  ): string {
    return titleCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    return alias + '__' + propertyPath.replace('.', '_');
  }
}
