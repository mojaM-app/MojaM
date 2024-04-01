/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService } from '@events';
import { LoginDto } from '@modules/auth';
import { PermissionsRoute, SystemPermission } from '@modules/permissions';
import { IUser, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers, testEventHandlers } from '@utils/tests-events.utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import { Guid } from 'guid-typescript';
import request from 'supertest';

describe('POST /permissions', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('POST /permissions/userId/permissionId should respond with status code of 404', () => {
    it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId is missing', async () => {
      const path = permissionsRoute.path + '/' + SystemPermission.ActivateUser.toString();
      const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId is invalid', async () => {
      const path = permissionsRoute.path + '/invalid-user-id/' + Guid.EMPTY;
      const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST /permissions/userId/permissionId should respond with a status code of 404 when permissionId is missing', async () => {
      const path = permissionsRoute.path + '/' + Guid.EMPTY;
      const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST /permissions/userId/permissionId should respond with a status code of 404 when permissionId is invalid', async () => {
      const path = permissionsRoute.path + '/' + Guid.EMPTY + '/invalid-permission-id';
      const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId and permissionId are missing', async () => {
      const path = permissionsRoute.path;
      const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
      expect(response.statusCode).toBe(404);
    });

    it('POST /permissions/userId/permissionId should respond with a status code of 404 when userId and permissionId are invalid', async () => {
      const path = permissionsRoute.path + '/invalid-user-id/invalid-permission-id';
      const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
      expect(response.statusCode).toBe(404);
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});

describe('POST /permissions/userId/permissionId should respond with a status code of 400', () => {
  const usersRoute = new UsersRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAuthToken: string | undefined;
  beforeAll(async () => {
    const { email: login, password } = getAdminLoginData();

    adminAuthToken = (await loginAs(app, { login, password } satisfies LoginDto)).authToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  test('POST /permissions/userId/permissionId should respond with a status code of 400 when user not exist', async () => {
    const path = permissionsRoute.path + '/' + Guid.EMPTY + '/' + SystemPermission.ActivateUser.toString();
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = response.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    expect(data).toBe(false);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  test('POST /permissions/userId/permissionId should respond with a status code of 400 when permission not exist', async () => {
    const newUser = generateValidUser();
    const createUserResponse = await request(app.getServer()).post(usersRoute.path).send(newUser).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(createUserResponse.statusCode).toBe(201);
    const { data: newUserDto, message: createMessage }: { data: IUser; message: string } = createUserResponse.body;
    expect(newUserDto?.uuid).toBeDefined();

    const deleteResponse = await request(app.getServer())
      .delete(usersRoute.path + '/' + newUserDto.uuid)
      .send()
      .set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteResponse.statusCode).toBe(200);

    const path = permissionsRoute.path + '/' + newUserDto?.uuid + '/0';
    const response = await request(app.getServer()).post(path).send().set('Authorization', `Bearer ${adminAuthToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    const body = response.body;
    expect(typeof body).toBe('object');
    const data = body.data;
    expect(data).toBe(false);

    // checking events running via eventDispatcher
    Object.entries(testEventHandlers)
      .filter(
        ([, eventHandler]) =>
          ![testEventHandlers.onUserCreated, testEventHandlers.onUserRetrieved, testEventHandlers.onUserDeleted].includes(eventHandler),
      )
      .forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
