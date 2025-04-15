import { BASE_PATH, CREDENTIALS, LOG_FORMAT, NODE_ENV, ORIGIN, PORT } from '@config';
import { DbConnection } from '@db';
import { errorKeys } from '@exceptions';
import { IRoutes } from '@interfaces';
import { ErrorMiddleware } from '@middlewares';
import { AuthRoute } from '@modules/auth';
import { getFullUrl } from '@utils';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import 'reflect-metadata';
import { logger, stream } from './modules/logger';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  private _connection: DbConnection | undefined = undefined;

  constructor() {
    this.app = express();
    this.env = NODE_ENV ?? 'development';
    this.port = PORT ?? 5100;
  }

  public async initialize(routes: IRoutes[]): Promise<void> {
    await this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info('=================================');
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`App listening on the port ${this.port}`);
      logger.info('=================================');
    });
  }

  public getServer(): express.Application {
    return this.app;
  }

  public async closeDbConnection(): Promise<void> {
    await this._connection?.close();
  }

  private initializeMiddlewares(): void {
    this.app.use(morgan(LOG_FORMAT ?? 'combined', { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.disable('x-powered-by');
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: IRoutes[]): void {
    // auth rout is added always
    this.addAuthRoute();

    routes.forEach(route => {
      this.setRout(route);
    });

    this.app.use(function (req, res) {
      const url = getFullUrl(req);
      res.status(404).json({ message: errorKeys.general.Resource_Does_Not_Exist, url });
    });
  }

  private addAuthRoute(): void {
    const authRoute = new AuthRoute();
    this.setRout(authRoute);
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware);
  }

  private setRout(route: IRoutes): void {
    const path = BASE_PATH ?? '';
    this.app.use(path, route.router);
  }

  private async initializeDatabase(): Promise<void> {
    // establish database connection
    logger.info('=== establishing database connection ===');

    this._connection = DbConnection.getConnection();
    try {
      await this._connection.connect();
      logger.info('Data Source has been initialized successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Fatal error during Data Source initialization: ${errorMessage}`);

      // In production, we might want to exit the process if we can't connect to the database
      if (this.env === 'production') {
        logger.error('Could not connect to database in production environment. Exiting process...');
        process.exit(1);
      } else {
        // In development/test, we might want to continue but with a warning
        logger.warn('Continuing without database connection. Some features may not work correctly.');
      }
    }
  }
}
