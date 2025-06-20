import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { titleCase } from 'typeorm/util/StringUtils';

export class TitleCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  public tableName(className: string, customName: string): string {
    return (customName?.length ?? 0) > 0 ? customName : titleCase(className);
  }

  public columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return titleCase(embeddedPrefixes.concat('').join('_')) + ((customName?.length ?? 0) > 0 ? customName : titleCase(propertyName));
  }

  public relationName(propertyName: string): string {
    return titleCase(propertyName);
  }

  public joinColumnName(relationName: string, referencedColumnName: string): string {
    return titleCase(relationName + '_' + referencedColumnName);
  }

  public joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string): string {
    return titleCase(firstTableName + '_' + firstPropertyName.replace(/\./gi, '_') + '_' + secondTableName);
  }

  public joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return titleCase(tableName + '_' + ((columnName?.length ?? 0) > 0 ? columnName : propertyName));
  }

  public classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string {
    return titleCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  public eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    return alias + '__' + propertyPath.replace('.', '_');
  }
}
