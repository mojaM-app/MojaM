import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@config';

export const getAdminLoginData = (): { uuid: string; email: string; phone: string; passcode: string } => {
  return {
    uuid: '2eaa394a-649d-44c1-b797-4a9e4ed2f836',
    email: ADMIN_EMAIL!,
    phone: '123456789',
    passcode: ADMIN_PASSWORD!,
  };
};
