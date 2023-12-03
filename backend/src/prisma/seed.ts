import { SystemPermission } from '@/modules/permissions/system-permission.enum';
import { PrismaClient } from '@prisma/client';
import { generateRandomEmail, generateRandomNumber, generateRandomString } from './../utils/tests.utils';

const prisma = new PrismaClient();

const seedSystemPermission = async (prisma: PrismaClient) => {
  await prisma.systemPermission.upsert({
    where: { id: 100 },
    update: {},
    create: {
      id: 100,
      name: 'UserList',
      description: 'User list permission group',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.PreviewUserList },
    update: {},
    create: {
      id: SystemPermission.PreviewUserList,
      parentId: 100,
      name: 'PreviewUserList',
      description: 'Permission that allows preview User list',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.PreviewUserProfile },
    update: {},
    create: {
      id: SystemPermission.PreviewUserProfile,
      parentId: 100,
      name: 'PreviewUserProfile',
      description: 'Permission that allows preview any User profile',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.EditUserProfile },
    update: {},
    create: {
      id: SystemPermission.EditUserProfile,
      parentId: 100,
      name: 'EditUserProfile',
      description: 'Permission that allows edit any User profile information (without password)',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.DeactivateUserProfile },
    update: {},
    create: {
      id: SystemPermission.DeactivateUserProfile,
      parentId: 100,
      name: 'DeactivateUserProfile',
      description: 'Permission that allows deactivate User',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.ActivateUserProfile },
    update: {},
    create: {
      id: SystemPermission.ActivateUserProfile,
      parentId: 100,
      name: 'ActivateUserProfile',
      description: 'Permission that allows activate User',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.DeleteUserProfile },
    update: {},
    create: {
      id: SystemPermission.DeleteUserProfile,
      parentId: 100,
      name: 'DeleteUserProfile',
      description: 'Permission that allows delete User (user is not deleted, is anonymized)',
    },
  });

  await prisma.systemPermission.upsert({
    where: { id: SystemPermission.UnlockUserProfile },
    update: {},
    create: {
      id: SystemPermission.UnlockUserProfile,
      parentId: 100,
      name: 'UnlockUserProfile',
      description: 'Permission that allows unlock User (when user locks his profile by entering the wrong login or password several times)',
    },
  });
};

const seedUsers = async (prisma: PrismaClient) => {
  let email: string = generateRandomEmail();
  let phone: string = generateRandomNumber(9);
  await prisma.user.upsert({
    where: { email_phone: { email: email, phone: phone } },
    update: {},
    create: {
      email: email,
      phone: phone,
      password: 'pass',
      isActive: true,
      firstName: generateRandomString(10),
      lastName: generateRandomString(10),
    },
  });

  const user = await prisma.user.findFirst();

  email = generateRandomEmail();
  phone = generateRandomNumber(9);
  await prisma.user.upsert({
    where: { email_phone: { email: email, phone: phone } },
    update: {},
    create: {
      email: email,
      phone: phone,
      password: 'pass',
      isActive: true,
      firstName: generateRandomString(10),
      lastName: generateRandomString(10),
      systemPermissions: {
        createMany: {
          data: [
            {
              permissionId: SystemPermission.PreviewUserList,
              assignedAt: new Date(),
              assignedById: user.id,
            },
            {
              permissionId: SystemPermission.PreviewUserProfile,
              assignedAt: new Date(),
              assignedById: user.id,
            },
          ],
        },
      },
    },
  });
};

async function main() {
  await seedSystemPermission(prisma);

  await seedUsers(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
