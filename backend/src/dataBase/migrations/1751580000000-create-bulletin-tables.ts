import { MigrationInterface, QueryRunner } from 'typeorm';
import { SystemPermissions } from '../../core/enums/system-permissions.enum';

export class CreateBulletinTables1751580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`bulletins\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`Uuid\` varchar(36) NOT NULL,
        \`State\` tinyint NOT NULL DEFAULT 1,
        \`Title\` varchar(500) NULL,
        \`Date\` date NULL,
        \`Number\` int NULL,
        \`Introduction\` text NULL,
        \`TipsForWork\` text NULL,
        \`DailyPrayer\` text NULL,
        \`CreatedById\` int NOT NULL,
        \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedById\` int NULL,
        \`UpdatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`PublishedById\` int NULL,
        \`PublishedAt\` timestamp NULL,
        UNIQUE INDEX \`UQ_Bulletin_Uuid\` (\`Uuid\`),
        UNIQUE INDEX \`UQ_Bulletin_Date\` (\`Date\`),
        FULLTEXT INDEX \`IXD_Bulletin_Introduction_Fulltext\` (\`Introduction\`),
        FULLTEXT INDEX \`IXD_Bulletin_TipsForWork_Fulltext\` (\`TipsForWork\`),
        FULLTEXT INDEX \`IXD_Bulletin_DailyPrayer_Fulltext\` (\`DailyPrayer\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletins\`
      ADD CONSTRAINT \`FK_Bulletin_CreatedById_To_User\`
      FOREIGN KEY (\`CreatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletins\`
      ADD CONSTRAINT \`FK_Bulletin_UpdatedById_To_User\`
      FOREIGN KEY (\`UpdatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletins\`
      ADD CONSTRAINT \`FK_Bulletin_PublishedById_To_User\`
      FOREIGN KEY (\`PublishedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE \`bulletin_days\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`BulletinId\` int NOT NULL,
        \`Uuid\` varchar(36) NOT NULL,
        \`Title\` varchar(500) NULL,
        \`Date\` date NULL,
        \`CreatedById\` int NOT NULL,
        \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedById\` int NULL,
        \`UpdatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`Settings\` json NULL,
        UNIQUE INDEX \`UQ_BulletinDay_Uuid\` (\`Uuid\`),
        UNIQUE INDEX \`UQ_BulletinDay_Date\` (\`Date\`),
        FULLTEXT INDEX \`IXD_BulletinDay_Title_Fulltext\` (\`Title\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_days\`
      ADD CONSTRAINT \`FK_BulletinDay_BulletinId_To_Bulletin\`
      FOREIGN KEY (\`BulletinId\`) REFERENCES \`bulletins\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_days\`
      ADD CONSTRAINT \`FK_BulletinDay_CreatedById_To_User\`
      FOREIGN KEY (\`CreatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_days\`
      ADD CONSTRAINT \`FK_BulletinDay_UpdatedById_To_User\`
      FOREIGN KEY (\`UpdatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE \`bulletin_day_sections\` (
        \`Id\` int NOT NULL AUTO_INCREMENT,
        \`DayId\` int NOT NULL,
        \`Uuid\` varchar(36) NOT NULL,
        \`Order\` int NOT NULL DEFAULT 0,
        \`Type\` varchar(36) NOT NULL,
        \`Title\` varchar(500) NULL,
        \`Content\` text NULL,
        \`CreatedById\` int NOT NULL,
        \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`UpdatedById\` int NULL,
        \`UpdatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`Settings\` json NULL,
        UNIQUE INDEX \`UQ_BulletinDaySection_Uuid\` (\`Uuid\`),
        FULLTEXT INDEX \`IXD_BulletinDaySection_Title_Fulltext\` (\`Title\`),
        FULLTEXT INDEX \`IXD_BulletinDaySection_Content_Fulltext\` (\`Content\`),
        PRIMARY KEY (\`Id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_day_sections\`
      ADD CONSTRAINT \`FK_BulletinDaySection_DayId_To_BulletinDay\`
      FOREIGN KEY (\`DayId\`) REFERENCES \`bulletin_days\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_day_sections\`
      ADD CONSTRAINT \`FK_BulletinDaySection_CreatedById_To_User\`
      FOREIGN KEY (\`CreatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`bulletin_day_sections\`
      ADD CONSTRAINT \`FK_BulletinDaySection_UpdatedById_To_User\`
      FOREIGN KEY (\`UpdatedById\`) REFERENCES \`users\`(\`Id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    // // Create bulletin_day_tasks table
    // await queryRunner.query(`
    //   CREATE TABLE \`bulletin_day_tasks\` (
    //     \`Id\` int NOT NULL AUTO_INCREMENT,
    //     \`BulletinDayId\` int NOT NULL,
    //     \`TaskOrder\` int NOT NULL,
    //     \`Description\` text NOT NULL,
    //     \`HasCommentField\` boolean NOT NULL DEFAULT false,
    //     INDEX \`IDX_BulletinDayTask_BulletinDayId_Order\` (\`BulletinDayId\`, \`TaskOrder\`),
    //     PRIMARY KEY (\`Id\`)
    //   ) ENGINE=InnoDB
    // `);

    // // Create bulletin_questions table
    // await queryRunner.query(`
    //   CREATE TABLE \`bulletin_questions\` (
    //     \`Id\` int NOT NULL AUTO_INCREMENT,
    //     \`BulletinDayId\` int NOT NULL,
    //     \`UserId\` int NOT NULL,
    //     \`QuestionType\` tinyint NOT NULL,
    //     \`Content\` text NOT NULL,
    //     \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     \`UpdatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //     INDEX \`IDX_BulletinQuestion_BulletinDayId\` (\`BulletinDayId\`),
    //     INDEX \`IDX_BulletinQuestion_UserId\` (\`UserId\`),
    //     INDEX \`IDX_BulletinQuestion_Type\` (\`QuestionType\`),
    //     PRIMARY KEY (\`Id\`)
    //   ) ENGINE=InnoDB
    // `);

    // // Create bulletin_question_answers table
    // await queryRunner.query(`
    //   CREATE TABLE \`bulletin_question_answers\` (
    //     \`Id\` int NOT NULL AUTO_INCREMENT,
    //     \`QuestionId\` int NOT NULL,
    //     \`UserId\` int NOT NULL,
    //     \`Content\` text NOT NULL,
    //     \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     INDEX \`IDX_BulletinQuestionAnswer_QuestionId\` (\`QuestionId\`),
    //     INDEX \`IDX_BulletinQuestionAnswer_UserId\` (\`UserId\`),
    //     PRIMARY KEY (\`Id\`)
    //   ) ENGINE=InnoDB
    // `);

    // // Create user_bulletin_progress table
    // await queryRunner.query(`
    //   CREATE TABLE \`user_bulletin_progress\` (
    //     \`Id\` int NOT NULL AUTO_INCREMENT,
    //     \`UserId\` int NOT NULL,
    //     \`BulletinId\` int NOT NULL,
    //     \`DayNumber\` int NOT NULL,
    //     \`IsCompleted\` boolean NOT NULL DEFAULT false,
    //     \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     \`CompletedAt\` timestamp NULL,
    //     UNIQUE INDEX \`UQ_UserBulletinProgress_User_Bulletin_Day\` (\`UserId\`, \`BulletinId\`, \`DayNumber\`),
    //     INDEX \`IDX_UserBulletinProgress_UserId\` (\`UserId\`),
    //     INDEX \`IDX_UserBulletinProgress_BulletinId\` (\`BulletinId\`),
    //     INDEX \`IDX_UserBulletinProgress_IsCompleted\` (\`IsCompleted\`),
    //     PRIMARY KEY (\`Id\`)
    //   ) ENGINE=InnoDB
    // `);

    // // Create user_task_progress table
    // await queryRunner.query(`
    //   CREATE TABLE \`user_task_progress\` (
    //     \`Id\` int NOT NULL AUTO_INCREMENT,
    //     \`UserId\` int NOT NULL,
    //     \`TaskId\` int NOT NULL,
    //     \`IsCompleted\` boolean NOT NULL DEFAULT false,
    //     \`Comment\` text NULL,
    //     \`CreatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     \`UpdatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //     UNIQUE INDEX \`UQ_UserTaskProgress_User_Task\` (\`UserId\`, \`TaskId\`),
    //     INDEX \`IDX_UserTaskProgress_UserId\` (\`UserId\`),
    //     INDEX \`IDX_UserTaskProgress_TaskId\` (\`TaskId\`),
    //     INDEX \`IDX_UserTaskProgress_IsCompleted\` (\`IsCompleted\`),
    //     PRIMARY KEY (\`Id\`)
    //   ) ENGINE=InnoDB
    // `);

    // Add foreign key constraints

    // await queryRunner.query(`
    //   ALTER TABLE \`bulletin_day_tasks\`
    //   ADD CONSTRAINT \`FK_BulletinDayTask_To_BulletinDay\`
    //   FOREIGN KEY (\`BulletinDayId\`) REFERENCES \`bulletin_days\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`bulletin_questions\`
    //   ADD CONSTRAINT \`FK_BulletinQuestion_To_BulletinDay\`
    //   FOREIGN KEY (\`BulletinDayId\`) REFERENCES \`bulletin_days\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`bulletin_questions\`
    //   ADD CONSTRAINT \`FK_BulletinQuestion_To_User\`
    //   FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`bulletin_question_answers\`
    //   ADD CONSTRAINT \`FK_BulletinQuestionAnswer_To_Question\`
    //   FOREIGN KEY (\`QuestionId\`) REFERENCES \`bulletin_questions\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`bulletin_question_answers\`
    //   ADD CONSTRAINT \`FK_BulletinQuestionAnswer_To_User\`
    //   FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`user_bulletin_progress\`
    //   ADD CONSTRAINT \`FK_UserBulletinProgress_To_User\`
    //   FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`user_bulletin_progress\`
    //   ADD CONSTRAINT \`FK_UserBulletinProgress_To_Bulletin\`
    //   FOREIGN KEY (\`BulletinId\`) REFERENCES \`bulletins\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`user_task_progress\`
    //   ADD CONSTRAINT \`FK_UserTaskProgress_To_User\`
    //   FOREIGN KEY (\`UserId\`) REFERENCES \`users\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // await queryRunner.query(`
    //   ALTER TABLE \`user_task_progress\`
    //   ADD CONSTRAINT \`FK_UserTaskProgress_To_Task\`
    //   FOREIGN KEY (\`TaskId\`) REFERENCES \`bulletin_day_tasks\`(\`Id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    // `);

    // Add bulletin administration permissions
    await queryRunner.query('INSERT INTO `system_permissions` (`Id`, `Name`, `Description`) VALUES (?, ?, ?)', [
      50,
      'BulletinAdministration',
      'Bulletin administration permission group',
    ]);

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [
        SystemPermissions.PreviewBulletinList,
        'PreviewBulletinList',
        'Permission that allows preview bulletin list',
        50,
      ],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.AddBulletin, 'AddBulletin', 'Permission that allows add bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.EditBulletin, 'EditBulletin', 'Permission that allows edit bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.DeleteBulletin, 'DeleteBulletin', 'Permission that allows delete bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [SystemPermissions.PublishBulletin, 'PublishBulletin', 'Permission that allows publish bulletins', 50],
    );

    await queryRunner.query(
      'INSERT INTO `system_permissions` (`Id`, `Name`, `Description`, `ParentId`) VALUES (?, ?, ?, ?)',
      [
        SystemPermissions.AnswerBulletinQuestion,
        'AnswerBulletinQuestion',
        'Permission that allows answer bulletin questions',
        50,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove bulletin permissions
    await queryRunner.query('DELETE FROM `system_permissions` WHERE `Id` IN (?, ?, ?, ?, ?, ?, ?)', [
      SystemPermissions.PreviewBulletinList,
      SystemPermissions.AddBulletin,
      SystemPermissions.EditBulletin,
      SystemPermissions.DeleteBulletin,
      SystemPermissions.PublishBulletin,
      SystemPermissions.AnswerBulletinQuestion,
      50,
    ]);

    // Drop foreign key constraints in reverse order
    //await queryRunner.query('ALTER TABLE `user_task_progress` DROP FOREIGN KEY `FK_UserTaskProgress_To_Task`');
    //await queryRunner.query('ALTER TABLE `user_task_progress` DROP FOREIGN KEY `FK_UserTaskProgress_To_User`');
    // await queryRunner.query(
    //   'ALTER TABLE `user_bulletin_progress` DROP FOREIGN KEY `FK_UserBulletinProgress_To_Bulletin`',
    // );
    // await queryRunner.query('ALTER TABLE `user_bulletin_progress` DROP FOREIGN KEY `FK_UserBulletinProgress_To_User`');
    // await queryRunner.query(
    //   'ALTER TABLE `bulletin_question_answers` DROP FOREIGN KEY `FK_BulletinQuestionAnswer_To_User`',
    // );
    // await queryRunner.query(
    //   'ALTER TABLE `bulletin_question_answers` DROP FOREIGN KEY `FK_BulletinQuestionAnswer_To_Question`',
    // );
    //await queryRunner.query('ALTER TABLE `bulletin_questions` DROP FOREIGN KEY `FK_BulletinQuestion_To_User`');
    //await queryRunner.query('ALTER TABLE `bulletin_questions` DROP FOREIGN KEY `FK_BulletinQuestion_To_BulletinDay`');
    //await queryRunner.query('ALTER TABLE `bulletin_day_tasks` DROP FOREIGN KEY `FK_BulletinDayTask_To_BulletinDay`');
    await queryRunner.query('ALTER TABLE `bulletin_days` DROP FOREIGN KEY `FK_BulletinDay_To_Bulletin`');
    await queryRunner.query('ALTER TABLE `bulletin_days` DROP FOREIGN KEY `FK_BulletinDay_CreatedById_To_User`');
    await queryRunner.query('ALTER TABLE `bulletin_days` DROP FOREIGN KEY `FK_BulletinDay_UpdatedById_To_User`');

    await queryRunner.query('ALTER TABLE `bulletins` DROP FOREIGN KEY `FK_Bulletin_PublishedById_To_User`');
    await queryRunner.query('ALTER TABLE `bulletins` DROP FOREIGN KEY `FK_Bulletin_UpdatedById_To_User`');
    await queryRunner.query('ALTER TABLE `bulletins` DROP FOREIGN KEY `FK_Bulletin_CreatedById_To_User`');

    // Drop tables in reverse order of creation
    //await queryRunner.query('DROP TABLE `user_task_progress`');
    //await queryRunner.query('DROP TABLE `user_bulletin_progress`');
    //await queryRunner.query('DROP TABLE `bulletin_question_answers`');
    //await queryRunner.query('DROP TABLE `bulletin_questions`');
    //await queryRunner.query('DROP TABLE `bulletin_day_tasks`');
    await queryRunner.query('DROP TABLE `bulletin_days`');
    await queryRunner.query('DROP TABLE `bulletins`');
  }
}
