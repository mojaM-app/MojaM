import { TitleCaseNamingStrategy } from './title-case-naming.strategy';

describe('TitleCaseNamingStrategy', () => {
  let strategy: TitleCaseNamingStrategy;

  beforeEach(() => {
    strategy = new TitleCaseNamingStrategy();
  });

  describe('tableName', () => {
    it('should return custom name when provided', () => {
      const result = strategy.tableName('someClass', 'CustomTable');
      expect(result).toBe('CustomTable');
    });

    it('should return title case of class name when no custom name', () => {
      const result = strategy.tableName('someClass', '');
      expect(result).toBe('Someclass'); // titleCase converts to lowercase with first letter uppercase
    });

    it('should handle empty custom name', () => {
      const result = strategy.tableName('userEntity', '');
      expect(result).toBe('Userentity'); // titleCase converts to lowercase with first letter uppercase
    });
  });

  describe('columnName', () => {
    it('should return custom name when provided', () => {
      const result = strategy.columnName('someProperty', 'CustomColumn', []);
      expect(result).toBe('CustomColumn');
    });

    it('should return title case of property name when no custom name', () => {
      const result = strategy.columnName('someProperty', '', []);
      expect(result).toBe('Someproperty');
    });

    it('should handle embedded prefixes', () => {
      const result = strategy.columnName('someProperty', '', ['prefix1', 'prefix2']);
      expect(result).toBe('Prefix1_prefix2_Someproperty'); // titleCase behavior
    });

    it('should combine embedded prefixes with custom name', () => {
      const result = strategy.columnName('someProperty', 'CustomColumn', ['prefix']);
      expect(result).toBe('Prefix_CustomColumn');
    });
  });

  describe('relationName', () => {
    it('should return title case of property name', () => {
      const result = strategy.relationName('someRelation');
      expect(result).toBe('Somerelation');
    });

    it('should handle camelCase property names', () => {
      const result = strategy.relationName('userProfile');
      expect(result).toBe('Userprofile');
    });
  });

  describe('joinColumnName', () => {
    it('should join relation name and referenced column name', () => {
      const result = strategy.joinColumnName('user', 'id');
      expect(result).toBe('User_id');
    });

    it('should handle complex names', () => {
      const result = strategy.joinColumnName('userProfile', 'userId');
      expect(result).toBe('Userprofile_userid');
    });
  });

  describe('joinTableName', () => {
    it('should join table names with property name', () => {
      const result = strategy.joinTableName('user', 'role', 'roles');
      expect(result).toBe('User_roles_role');
    });

    it('should replace dots in property name with underscores', () => {
      const result = strategy.joinTableName('user', 'permission', 'user.permissions');
      expect(result).toBe('User_user_permissions_permission');
    });
  });

  describe('joinTableColumnName', () => {
    it('should use custom column name when provided', () => {
      const result = strategy.joinTableColumnName('user', 'id', 'customId');
      expect(result).toBe('User_customid');
    });

    it('should use property name when no column name provided', () => {
      const result = strategy.joinTableColumnName('user', 'id', '');
      expect(result).toBe('User_id');
    });

    it('should handle undefined column name', () => {
      const result = strategy.joinTableColumnName('user', 'profileId');
      expect(result).toBe('User_profileid');
    });
  });

  describe('classTableInheritanceParentColumnName', () => {
    it('should join parent table name with parent table id property', () => {
      const result = strategy.classTableInheritanceParentColumnName('baseEntity', 'id');
      expect(result).toBe('Baseentity_id');
    });

    it('should handle complex parent names', () => {
      const result = strategy.classTableInheritanceParentColumnName('userProfile', 'userId');
      expect(result).toBe('Userprofile_userid');
    });
  });

  describe('eagerJoinRelationAlias', () => {
    it('should join alias with property path using double underscores', () => {
      const result = strategy.eagerJoinRelationAlias('user', 'profile');
      expect(result).toBe('user__profile');
    });

    it('should replace dots with underscores in property path', () => {
      const result = strategy.eagerJoinRelationAlias('user', 'profile.settings');
      expect(result).toBe('user__profile_settings');
    });

    it('should handle multiple dots in property path', () => {
      const result = strategy.eagerJoinRelationAlias('user', 'profile.settings.theme');
      expect(result).toBe('user__profile_settings.theme');
    });
  });
});
