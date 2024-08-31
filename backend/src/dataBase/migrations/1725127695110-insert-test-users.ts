import { Guid } from 'guid-typescript';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { CryptoService } from './../../modules/auth/services/crypto.service';
import { generateRandomNumber } from './../../utils/tests.utils';

export class InsertTestUsers1725127695110 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // insert user without password
    const cryptoService = new CryptoService();

    const phone = generateRandomNumber(9);

    const users = [
      {
        email: 'usr@no.password',
        phone: generateRandomNumber(9),
        firstName: 'user',
        lastName: 'without password',
      },

      {
        email: 'some@email.com',
        phone: generateRandomNumber(9),
        firstName: 'user1 same email',
        lastName: 'without password',
      },
      {
        email: 'some@email.com',
        phone: generateRandomNumber(9),
        firstName: 'user2 same email',
        lastName: 'without password',
      },

      {
        email: 'some@phone1.com',
        phone,
        firstName: 'user1 same phone',
        lastName: 'without password',
      },
      {
        email: 'some@phone2.com',
        phone,
        firstName: 'user2 same phone',
        lastName: 'without password',
      },
    ];

    for (const user of users) {
      const uuid = Guid.create().toString();
      const salt = cryptoService.generateSalt();
      const refreshTokenKey = cryptoService.generateUserRefreshTokenKey();
      await queryRunner.query(
        "INSERT INTO `users` (`Uuid`,`Email`,`Phone`,`Salt`,`RefreshTokenKey`,`FirstName`,`LastName`,`IsActive`) VALUES ('" +
          uuid +
          "', '" +
          user.email +
          "', '" +
          user.phone +
          "', '" +
          salt +
          "', '" +
          refreshTokenKey +
          "', '" +
          user.firstName +
          "', '" +
          user.lastName +
          "', 1)",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
