import * as config from '@config';
import { AuthRoute } from '@modules/auth';
import { LinkHelper } from './link.helper';

describe('LinkHelper', () => {
  const mockClientAppUrl = 'http://localhost:3000';
  const userUuid = 'test-uuid';
  const resetPasswordToken = 'test-token';

  describe('activateAccountLink', () => {
    it('should generate the correct activation link', () => {
      jest.replaceProperty(config, 'CLIENT_APP_URL', mockClientAppUrl);
      const link = LinkHelper.activateAccountLink(userUuid);
      expect(link).toContain(`${mockClientAppUrl}/account/${userUuid}/activate?t=`);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe('resetPasswordLink', () => {
    it('should generate the correct reset password link', () => {
      jest.replaceProperty(config, 'CLIENT_APP_URL', mockClientAppUrl);
      const link = LinkHelper.resetPasswordLink(userUuid, resetPasswordToken);
      expect(link).toBe(`${mockClientAppUrl}/${AuthRoute.resetPassword}/${userUuid}/${resetPasswordToken}`);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe('getClientAppUrl', () => {
    it('should return the client app URL without trailing slash', () => {
      jest.replaceProperty(config, 'CLIENT_APP_URL', mockClientAppUrl);
      const url = (LinkHelper as any).getClientAppUrl();
      expect(url).toBe(mockClientAppUrl);
    });

    it('should remove trailing slash from client app URL', () => {
      jest.replaceProperty(config, 'CLIENT_APP_URL', `${mockClientAppUrl}/`);
      const url = (LinkHelper as any).getClientAppUrl();
      expect(url).toBe(mockClientAppUrl);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });
});
