import { App } from '@/app';
import { events } from '@events/events';
import { error_keys } from '@exceptions/error.keys';
import { PermissionsRoute } from '@modules/permissions/permissions.routes';
import { IUser } from '@modules/users/interfaces/IUser';
import { generateValidUser } from '@modules/users/tests/user-tests.helpers';
import { UsersRoute } from '@modules/users/users.routes';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('DELETE /users', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  describe('user deletion', () => {
    test('DELETE/users should respond with a status code of 200', async () => {
      const user = generateValidUser();

      const createResponse = await request(app.getServer()).post(usersRoute.path).send(user);
      expect(createResponse.statusCode).toBe(201);
      const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createResponse.body;
      expect(newUserDto?.uuid).toBeDefined();
      expect(createMessage).toBe(events.users.userCreated);

      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUserDto.uuid)
        .send();
      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = body;
      expect(deleteMessage).toBe(events.users.userDeleted);
      expect(deletedUserUuid).toBe(newUserDto.uuid);
    });

    // test('DELETE/users should respond with a status code of 400 when trying to delete user that assigned roles to other users', async () => {
    //   let user = generateValidUser();

    //   let createResponse = await request(app.getServer()).post(usersRoute.path).send(user);
    //   expect(createResponse.statusCode).toBe(201);
    //   const { data: newUser1Dto, message: createMessage1 }: { data: IUser; message: string } = createResponse.body;
    //   expect(newUser1Dto?.uuid).toBeDefined();
    //   expect(createMessage1).toBe(events.users.userCreated);

    //   let getResponse = await request(app.getServer()).get(`${usersRoute.path}/${newUser1Dto.uuid}`).send();
    //   const { data: user1 }: { data: IUser } = getResponse.body;
    //   expect(getResponse.statusCode).toBe(200);
    //   expect(user1.uuid).toBe(newUser1Dto.uuid);

    //   user = generateValidUser();

    //   createResponse = await request(app.getServer()).post(usersRoute.path).send(user);
    //   expect(createResponse.statusCode).toBe(201);
    //   const { data: newUser2Dto, message: createMessage2 }: { data: IUser; message: string } = createResponse.body;
    //   expect(newUser2Dto?.uuid).toBeDefined();
    //   expect(createMessage2).toBe(events.users.userCreated);

    //   getResponse = await request(app.getServer()).get(`${usersRoute.path}/${newUser2Dto.uuid}`).send();
    //   const { data: user2 }: { data: IUser } = getResponse.body;
    //   expect(getResponse.statusCode).toBe(200);
    //   expect(user2.uuid).toBe(newUser2Dto.uuid);

    //   const addPermissionResponse = await request(app.getServer())
    //     .post(`${permissionsRoute.path}/${newUserDto.uuid}/${SystemPermission.PreviewUserList}`)
    //     .send();
    //   const { data: addPermissionResult, message: addPermissionMessage }: { data: boolean; message: string } = addPermissionResponse.body;
    //   expect(addPermissionResponse.statusCode).toBe(201);
    //   expect(addPermissionResult).toBe(true);

    //   const deleteResponse = await request(app.getServer())
    //     .delete(usersRoute.path + '/' + newUserDto.uuid)
    //     .send();
    //   expect(deleteResponse.statusCode).toBe(200);
    //   expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
    //   expect(typeof deleteResponse.body).toBe('object');
    //   const { data: deletedUserUuid, message: deleteMessage }: { data: string; message: string } = deleteResponse.body;
    //   expect(deleteMessage).toBe(events.users.userDeleted);
    //   expect(deletedUserUuid).toBe(newUserDto.uuid);
    // });

    test('DELETE/users should respond with a status code of 400 when user not exist', async () => {
      const userId: string = Guid.EMPTY;
      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + userId)
        .send();
      expect(deleteResponse.statusCode).toBe(400);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const data = body.data;
      const { message: deleteMessage, args: deleteArgs }: { message: string; args: string[] } = data;
      expect(deleteMessage).toBe(error_keys.users.create.User_Does_Not_Exist);
      expect(deleteArgs.length).toBe(1);
      expect(deleteArgs[0]).toBe(userId);
    });

    test('DELETE/users should respond with a status code of 404 when user Id is not GUID', async () => {
      const deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/invalid-guid')
        .send();
      expect(deleteResponse.statusCode).toBe(404);
      expect(deleteResponse.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = deleteResponse.body;
      expect(typeof body).toBe('object');
      const { message: deleteMessage }: { message: string } = body;
      expect(deleteMessage).toBe(error_keys.general.Page_Does_Not_Exist);
    });
  });
});
