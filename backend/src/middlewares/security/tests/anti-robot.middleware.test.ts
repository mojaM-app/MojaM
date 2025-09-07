import { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { antiRobotMiddleware, robotsTxtMiddleware } from '../anti-robot.middleware';

jest.mock('@core', () => ({
  fileLogger: {
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Anti-Robot Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      get: jest.fn(),
      path: '/',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' } as any,
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('antiRobotMiddleware', () => {
    it('should block Googlebot', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(
        'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      );

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access denied',
        error: 'Automated access is not permitted',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block Bingbot', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      );

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block requests to robots.txt path', () => {
      (mockRequest as any).path = '/robots.txt';
      (mockRequest.get as jest.Mock).mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access denied',
        error: 'This resource is not available for automated access',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block requests to sitemap.xml path', () => {
      (mockRequest as any).path = '/sitemap.xml';
      (mockRequest.get as jest.Mock).mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block suspicious user agents (empty)', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('');

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block suspicious user agents (too short)', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('bot/1.0');

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block curl requests', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('curl/7.68.0');

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow legitimate browser requests', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle missing User-Agent gracefully', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block security scanners', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Nmap Scripting Engine; https://nmap.org/book/nse.html');

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block social media crawlers', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      );

      antiRobotMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCode.ClientErrorForbidden);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('robotsTxtMiddleware', () => {
    it('should serve robots.txt content with proper headers', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      (mockRequest as any).ip = '192.168.1.1';

      robotsTxtMiddleware(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400',
        'X-Robots-Tag': 'noindex, nofollow',
      });

      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('User-agent: *'));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('Disallow: /'));
    });

    it('should log robots.txt requests', () => {
      const { fileLogger } = require('@core');
      (mockRequest.get as jest.Mock).mockReturnValue('Googlebot/2.1');
      (mockRequest as any).ip = '66.249.66.1';

      robotsTxtMiddleware(mockRequest as Request, mockResponse as Response);

      expect(fileLogger.info).toHaveBeenCalledWith(expect.stringContaining('Served robots.txt to IP: 66.249.66.1'));
    });
  });
});
