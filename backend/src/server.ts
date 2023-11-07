import { App } from '@/app';
import { AuthRoute } from '@modules/auth/auth.routes';
import { UserRoute } from '@modules/users/users.routes';
import { ValidateEnv } from '@utils/validateEnv';
import { NewsRoute } from '@modules/news/news.routes';
import { CommunityRoute } from '@modules/community/community.routes';

ValidateEnv();

const app = new App([new CommunityRoute(), new NewsRoute(), new UserRoute(), new AuthRoute()]);

app.listen();
