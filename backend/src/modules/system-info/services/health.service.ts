import { BASE_PATH, DATABASE_HOST, DATABASE_NAME, LOG_LEVEL, NODE_ENV, PORT } from '@config';
import { DbConnectionManager } from '@db';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Service } from 'typedi';

export interface IHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
}

export interface ISystemInfo extends IHealthStatus {
  uptime: number;
  environment: {
    nodeEnv: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    hostname: string;
  };
  application: {
    name: string;
    version: string;
    port: string | number;
    basePath: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    name: string;
    host: string;
    type: string;
    version?: string;
  };
  system: {
    cpus: number;
    totalMemory: string;
    freeMemory: string;
    memoryUsage: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
    loadAverage: number[];
  };
  logging: {
    level: string;
  };
}

@Service()
export class HealthService {
  private startTime = Date.now();

  public async getHealthStatus(): Promise<IHealthStatus> {
    const dbStatus = await this.checkDatabaseConnection();

    return {
      status: dbStatus.status === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }

  public async getSystemInfo(): Promise<ISystemInfo> {
    const dbStatus = await this.checkDatabaseConnection();
    const memoryUsage = process.memoryUsage();
    const packageJson = this.getPackageJson();

    return {
      status: dbStatus.status === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // uptime in seconds
      environment: {
        nodeEnv: NODE_ENV ?? 'unknown',
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      application: {
        name: packageJson.name ?? 'moja_m_backend_app',
        version: packageJson.version ?? '0.0.0',
        port: PORT ?? 5100,
        basePath: BASE_PATH ?? '/api',
      },
      database: dbStatus,
      system: {
        cpus: os.cpus().length,
        totalMemory: this.formatBytes(os.totalmem()),
        freeMemory: this.formatBytes(os.freemem()),
        memoryUsage: {
          rss: this.formatBytes(memoryUsage.rss),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          external: this.formatBytes(memoryUsage.external),
        },
        loadAverage: os.loadavg(),
      },
      logging: {
        level: LOG_LEVEL ?? 'info',
      },
    };
  }

  private async checkDatabaseConnection(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    name: string;
    host: string;
    type: string;
    version?: string;
  }> {
    try {
      const connection = DbConnectionManager.getConnection();
      const dbContext = connection.getDbContext();

      if (!dbContext || !dbContext.isInitialized) {
        return {
          status: 'disconnected',
          name: DATABASE_NAME ?? 'unknown',
          host: DATABASE_HOST ?? 'unknown',
          type: 'mysql',
        };
      }

      // Try to execute a simple query to verify connection
      await dbContext.query('SELECT 1');

      // Get database version
      let version: string | undefined;
      try {
        const versionResult = await dbContext.query('SELECT VERSION() as version');
        if (Array.isArray(versionResult) && versionResult.length > 0) {
          version = versionResult[0].version;
        }
      } catch {
        // If version query fails, continue without version info
      }

      return {
        status: 'connected',
        name: DATABASE_NAME ?? 'unknown',
        host: DATABASE_HOST ?? 'unknown',
        type: 'mysql',
        version,
      };
    } catch {
      return {
        status: 'error',
        name: DATABASE_NAME ?? 'unknown',
        host: DATABASE_HOST ?? 'unknown',
        type: 'mysql',
      };
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  private getPackageJson(): { name?: string; version?: string } {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return {
          name: packageJson.name,
          version: packageJson.version,
        };
      }
    } catch {
      // If we can't read package.json, return defaults
    }
    return {};
  }
}
