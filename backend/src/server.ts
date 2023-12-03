import { App } from '@/app';
import { AuthRoute } from '@modules/auth/auth.routes';
import { CommunityRoute } from '@modules/community/community.routes';
import { NewsRoute } from '@modules/news/news.routes';
import { PermissionsRoute } from '@modules/permissions/permissions.routes';
import { UsersRoute } from '@modules/users/users.routes';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new CommunityRoute(), new NewsRoute(), new UsersRoute(), new AuthRoute(), new PermissionsRoute()]);

app.listen();
