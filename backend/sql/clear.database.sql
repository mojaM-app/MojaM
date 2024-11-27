DROP TABLE IF EXISTS
user_reset_password_tokens,
user_to_systempermissions,
system_permissions,
announcement_items,
announcements,
users;

DROP VIEW IF EXISTS
vusers,
vannouncements;

DROP TABLE IF EXISTS _prisma_migrations,
typeorm_metadata,
_typeorm_metadata,
_migrations_history;

DROP PROCEDURE IF EXISTS SP_update_admin_permissions;
