export interface ISystemInfo {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
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
