import { BASE_PATH, LOG_FORMAT, NODE_ENV, PORT } from '@config';
import { IRoutes, logger, stream } from '@core';
import { DbConnectionManager } from '@db';
import { errorKeys } from '@exceptions';
import {
  corsOptions,
  ErrorMiddleware,
  generalRateLimit,
  requestIdMiddleware,
  securityHeaders,
  securityLoggingMiddleware,
} from '@middlewares';
import { getFullUrl } from '@utils';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import hpp from 'hpp';
import morgan from 'morgan';
import 'reflect-metadata';
import { StatusCode } from 'status-code-enum';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

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
    await DbConnectionManager.gracefulShutdown();
  }

  private initializeMiddlewares(): void {
    // Trust proxy configuration - must be set before other middleware that depends on req.ip
    this.configureTrustProxy();

    // Security middleware - order matters!
    this.app.use(requestIdMiddleware); // First - add request ID to all requests
    this.app.use(securityLoggingMiddleware); // Second - log security events with request ID
    this.app.use(generalRateLimit); // Third - rate limiting
    this.app.use(securityHeaders); // Fourth - security headers (now array)
    this.app.use(corsOptions); // Fifth - CORS

    this.app.use(morgan(LOG_FORMAT ?? 'combined', { stream }));

    this.app.disable('x-powered-by');
    this.app.use(hpp());

    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());
  }

  private configureTrustProxy(): void {
    // Configure trust proxy settings
    // This is essential for proper IP detection when behind a reverse proxy (nginx, load balancer, etc.)

    const trustProxyEnv = process.env.TRUST_PROXY;

    if (trustProxyEnv !== undefined) {
      // Use explicit environment variable value
      if (trustProxyEnv === 'true') {
        this.app.set('trust proxy', true);
        logger.info('Trust proxy enabled: true (all proxies trusted)');
      } else if (trustProxyEnv === 'false') {
        this.app.set('trust proxy', false);
        logger.info('Trust proxy disabled: false');
      } else {
        // Treat as specific proxy configuration (IP addresses, hop count, etc.)
        this.app.set('trust proxy', trustProxyEnv);
        logger.info(`Trust proxy configured with custom value: ${trustProxyEnv}`);
      }
    } else {
      // Default behavior based on environment
      const currentEnv = process.env.NODE_ENV ?? 'development';
      if (currentEnv === 'production') {
        // In production, enable trust proxy by default as it's likely behind a reverse proxy
        this.app.set('trust proxy', true);
        logger.info('Trust proxy enabled by default in production environment');
      } else {
        // In development, disable trust proxy by default
        this.app.set('trust proxy', false);
        logger.info('Trust proxy disabled by default in development environment');
      }
    }
  }

  private initializeRoutes(routes: IRoutes[]): void {
    routes.forEach(route => {
      this.setRout(route);
    });

    this.app.use(function (req, res) {
      const url = getFullUrl(req);
      res.status(StatusCode.ClientErrorNotFound).json({ message: errorKeys.general.Resource_Does_Not_Exist, url });
    });
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

    const connection = DbConnectionManager.getConnection();

    // Set up connection event handlers
    connection.on('connected', () => {
      logger.info('Database connection established successfully!');
    });

    connection.on('connection-failed', (error: any) => {
      logger.error('Database connection failed:', error);
    });

    connection.on('max-reconnection-attempts-reached', (attempts: any) => {
      logger.error(`Max reconnection attempts (${attempts}) reached. Database unavailable.`);
      if (this.env === 'production') {
        logger.error('Could not connect to database in production environment. Exiting process...');
        process.exit(1);
      }
    });

    try {
      await connection.connect();
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
