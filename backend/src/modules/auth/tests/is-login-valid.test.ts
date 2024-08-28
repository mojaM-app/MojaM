/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { App } from '@/app';
import { EventDispatcherService, events } from '@events';
import { AuthRoute, IsLoginValidResponseDto, LoginDto } from '@modules/auth';
import { PermissionsRoute } from '@modules/permissions';
import { CreateUserResponseDto, UsersRoute } from '@modules/users';
import { generateValidUser, loginAs } from '@modules/users/tests/user-tests.helpers';
import { registerTestEventHandlers } from '@utils/tests-events.utils';
import { generateRandomEmail, getAdminLoginData } from '@utils/tests.utils';
import { EventDispatcher } from 'event-dispatch';
import request from 'supertest';

describe('POST /auth/check-login', () => {
  const usersRoute = new UsersRoute();
  const authRoute = new AuthRoute();
  const permissionsRoute = new PermissionsRoute();
  const app = new App([usersRoute, permissionsRoute]);

  let adminAccessToken: string | undefined;
  beforeAll(async () => {
    const { email, password } = getAdminLoginData();

    adminAccessToken = (await loginAs(app, { email, password } satisfies LoginDto))?.accessToken;

    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  describe('when login data are valid (given email is unique, not exist or is empty)', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when exist only one user with given e-mail', async () => {
      const { email } = getAdminLoginData();
      const response = await request(app.getServer()).post(authRoute.checkLoginPath).send({ email });
      expect(response.statusCode).toBe(200);
      const body: IsLoginValidResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);
    });

    it('when NO user with given e-mail', async () => {
      const email = generateRandomEmail();
      const response = await request(app.getServer()).post(authRoute.checkLoginPath).send({ email });
      expect(response.statusCode).toBe(200);
      const body: IsLoginValidResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(true);
    });

    it('when e-mail empty or null', async () => {
      const testData: any[] = [null, ''];

      for (const email of testData) {
        const response = await request(app.getServer()).post(authRoute.checkLoginPath).send({ email });
        expect(response.statusCode).toBe(200);
        const body: IsLoginValidResponseDto = response.body;
        expect(typeof body).toBe('object');
        expect(body.data).toBe(true);
      }
    });
  });

  describe('when login data are invalid (given email is NOT unique)', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
    });

    it('when exist more then one user with given email and both are activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      let activateNewUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUser1Dto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      activateNewUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUser2Dto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer()).post(authRoute.checkLoginPath).send({ email });
      expect(response.statusCode).toBe(200);
      const body: IsLoginValidResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(false);

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and only one is activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const activateNewUserResponse = await request(app.getServer())
        .post(usersRoute.path + '/' + newUser1Dto.uuid + '/' + usersRoute.activatePath)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(activateNewUserResponse.statusCode).toBe(200);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer()).post(authRoute.checkLoginPath).send({ email });
      expect(response.statusCode).toBe(200);
      const body: IsLoginValidResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(false);

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });

    it('when exist more then one user with given email and NO one is activated', async () => {
      const user1 = generateValidUser();
      const user2 = generateValidUser();
      const email = user1.email;
      user2.email = email;
      expect(user1.email).toBe(user2.email);
      expect(user1.phone).not.toBe(user2.phone);

      const createUser1Response = await request(app.getServer()).post(usersRoute.path).send(user1).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser1Response.statusCode).toBe(201);
      const { data: newUser1Dto, message: createUser1Message }: CreateUserResponseDto = createUser1Response.body;
      expect(newUser1Dto?.uuid).toBeDefined();
      expect(createUser1Message).toBe(events.users.userCreated);
      expect(newUser1Dto.email).toBe(email);

      const createUser2Response = await request(app.getServer()).post(usersRoute.path).send(user2).set('Authorization', `Bearer ${adminAccessToken}`);
      expect(createUser2Response.statusCode).toBe(201);
      const { data: newUser2Dto, message: createUser2Message }: CreateUserResponseDto = createUser2Response.body;
      expect(newUser2Dto?.uuid).toBeDefined();
      expect(createUser2Message).toBe(events.users.userCreated);
      expect(newUser2Dto.email).toBe(email);

      expect(newUser1Dto.email).toBe(newUser2Dto.email);

      const response = await request(app.getServer()).post(authRoute.checkLoginPath).send({ email });
      expect(response.statusCode).toBe(200);
      const body: IsLoginValidResponseDto = response.body;
      expect(typeof body).toBe('object');
      expect(body.data).toBe(false);

      let deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser1Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
      deleteResponse = await request(app.getServer())
        .delete(usersRoute.path + '/' + newUser2Dto.uuid)
        .send()
        .set('Authorization', `Bearer ${adminAccessToken}`);
      expect(deleteResponse.statusCode).toBe(200);
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
