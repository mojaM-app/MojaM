import { App } from '@/app';
import { events } from '@events/events';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { IUser } from '@modules/users/interfaces/user.interface';
import { UsersRoute } from '@modules/users/users.routes';
import request from 'supertest';

describe('POST /users', () => {
  const route = new UsersRoute();
  const app = new App([route]);

  describe('when given data are valid', () => {
    test('POST/users should respond with a 201 status code and DELETE should respond with a 200 status code', async () => {
      const bodyData = [
        <CreateUserDto>{ email: 'email@domain.com', phone: '123456789', password: 'PaasssworD!' },
        <CreateUserDto>{ email: 'firstname.lastname@domain.com', phone: '123456789', password: 'PaasssworD@!' },
        <CreateUserDto>{ email: 'email@subdomain.domain.com', phone: '123456789', password: 'PaasssworD123@$' },
        <CreateUserDto>{ email: 'firstname+lastname@domain.com', phone: '123456789', password: 'PaasssworD123@$' },
        <CreateUserDto>{ email: '"email"@domain.com', phone: '123456789', password: 'PaasssworD123@$' },
        <CreateUserDto>{ email: '1234567890@domain.com', phone: '123456789', password: 'Passwordd' },
        <CreateUserDto>{ email: 'email@domain-one.com', phone: '123456789', password: 'Passwordd1' },
        <CreateUserDto>{ email: '_______@domain.com', phone: '123456789', password: 'Passwordd!' },
        <CreateUserDto>{ email: 'email@domain.name', phone: '123456789', password: 'PaasssworD123@$' },
        <CreateUserDto>{ email: 'firstname-lastname@domain.com', phone: '123456789', password: 'PaasssworD123@$' },
      ];
      for (const data of bodyData) {
        const createResponse = await request(app.getServer()).post(route.path).send(data);
        expect(createResponse.statusCode).toBe(201);
        expect(createResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        let body = createResponse.body;
        expect(typeof body).toBe('object');
        const { data: user, message: createMessage }: { data: IUser; message: string } = body;
        expect(user?.uuid).toBeDefined();
        expect(user?.email).toBeDefined();
        expect(user?.phone).toBeDefined();
        expect(user.hasOwnProperty('id')).toBe(false);
        expect(createMessage).toBe(events.users.userCreated);

        const deleteResponse = await request(app.getServer())
          .delete(route.path + '/' + user.uuid)
          .send();
        expect(deleteResponse.statusCode).toBe(200);
        expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
        body = deleteResponse.body;
        expect(typeof body).toBe('object');
        const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
        expect(deleteMessage).toBe(events.users.userDeleted);
        expect(deletedUserUuid).toBe(user.uuid);
      }
    });
  });

  describe('when given data are invalid', () => {
    test('POST/users should respond with a status code of 400 when password is invalid', async () => {
      const user = <CreateUserDto>{ email: 'email@domain.com', phone: '123456789' };
      const bodyData = [
        <CreateUserDto>{ ...user, password: null },
        <CreateUserDto>{ ...user, password: undefined },
        <CreateUserDto>{ ...user, password: undefined },
        <CreateUserDto>{ ...user, password: '' },
        <CreateUserDto>{ ...user, password: 'paasssword' },
        <CreateUserDto>{ ...user, password: 'P@sswo2!' },
      ];
      for (const body of bodyData) {
        const response = await request(app.getServer()).post(route.path).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (<string>response.body.data.message)?.split(',');
        expect(errors.filter(x => x.indexOf('Password') === -1).length).toBe(0);
      }
    });

    test('POST/users should respond with a status code of 400 when email is invalid', async () => {
      const user = <CreateUserDto>{ password: 'strongPassword1@', phone: '123456789' };

      const bodyData = [
        <CreateUserDto>{ ...user, email: null },
        <CreateUserDto>{ ...user, email: undefined },
        <CreateUserDto>{ ...user, email: undefined },
        <CreateUserDto>{ ...user, email: '' },
        <CreateUserDto>{ ...user, email: '  ' },
        <CreateUserDto>{ ...user, email: 'invalid email' },
        <CreateUserDto>{ ...user, email: 'email' },
        <CreateUserDto>{ ...user, email: 'email.domain.com' },
        <CreateUserDto>{ ...user, email: 'email@' },
        <CreateUserDto>{ ...user, email: '@domain.com' },
        <CreateUserDto>{ ...user, email: 'email@domain' },
        <CreateUserDto>{ ...user, email: 'email@domain.' },
        <CreateUserDto>{ ...user, email: 'email @domain.com' },
        <CreateUserDto>{ ...user, email: 'email@ domain.com' },
        <CreateUserDto>{ ...user, email: 'dd@dd@domain.com' },
        <CreateUserDto>{ ...user, email: 'a"b(c)d,e:f;g<h>i[jk]l@domain.com' },
        <CreateUserDto>{ ...user, email: 'just"not"right@domain.com' },
        <CreateUserDto>{ ...user, email: 'this is"notallowed@domain.com' },
        <CreateUserDto>{ ...user, email: 'this\nisnotallowed@domain.com' },
        <CreateUserDto>{ ...user, email: 'this\nis"notallowed@domain.com' },
        <CreateUserDto>{ ...user, email: '”(),:;<>[\\]@domain.com' },
        <CreateUserDto>{ ...user, email: '#@%^%#$@#$@#.com' },
        <CreateUserDto>{ ...user, email: 'Joe Smith <JoeSmith@domain.com>' },
        <CreateUserDto>{ ...user, email: '.email@domain.com' },
        <CreateUserDto>{ ...user, email: 'email.@domain.com' },
        <CreateUserDto>{ ...user, email: 'email..email@domain.com' },
        <CreateUserDto>{ ...user, email: 'JoeSmith@domain.com (Joe Smith)' },
        <CreateUserDto>{ ...user, email: 'email@-domain.com' },
        <CreateUserDto>{ ...user, email: 'email@.domain.com' },
        <CreateUserDto>{ ...user, email: 'email@111.222.333.44444' },
        <CreateUserDto>{ ...user, email: 'email@domain..com' },
        <CreateUserDto>{ ...user, email: 'Abc..123@domain.com' },
        <CreateUserDto>{ ...user, email: 'much.”more\\ unusual”@domain.com' },
        <CreateUserDto>{ ...user, email: 'very.unusual.”@”.unusual.com@domain.com' },
        <CreateUserDto>{ ...user, email: 'very.”(),:;<>[]”.VERY.”very@\\ "very”.unusual@strange.domain.com' },
        <CreateUserDto>{ ...user, email: 'email@123.123.123.123' },
        <CreateUserDto>{ ...user, email: 'email@[123.123.123.123]' },
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(route.path).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (<string>response.body.data.message)?.split(',');
        expect(errors.filter(x => x.indexOf('Email') === -1).length).toBe(0);
      }
    });

    test('POST/users should respond with a status code of 400 when phone is invalid', async () => {
      const user = <CreateUserDto>{ email: 'email@domain.com', password: 'strongPassword1@' };

      const bodyData = [
        <CreateUserDto>{ ...user, phone: null },
        <CreateUserDto>{ ...user, phone: undefined },
        <CreateUserDto>{ ...user, phone: undefined },
        <CreateUserDto>{ ...user, phone: '' },
        <CreateUserDto>{ ...user, phone: '  ' },
        <CreateUserDto>{ ...user, phone: 'invalid phone' },
        <CreateUserDto>{ ...user, phone: 'phone' },
        <CreateUserDto>{ ...user, phone: '1' },
        <CreateUserDto>{ ...user, phone: '12' },
        <CreateUserDto>{ ...user, phone: '123' },
        <CreateUserDto>{ ...user, phone: '1234' },
        <CreateUserDto>{ ...user, phone: '12345' },
        <CreateUserDto>{ ...user, phone: '123456' },
      ];

      for (const body of bodyData) {
        const response = await request(app.getServer()).post(route.path).send(body);
        expect(response.statusCode).toBe(400);
        const errors = (<string>response.body.data.message)?.split(',');
        expect(errors.filter(x => x.indexOf('Phone') === -1).length).toBe(0);
      }
    });
  });
});
