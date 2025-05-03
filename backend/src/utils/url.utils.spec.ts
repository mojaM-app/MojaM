import { getFullUrl } from './url.utils';

describe('URL Utils tests', () => {
  describe('getFullUrl', () => {
    it('should create a full URL from request parameters', () => {
      // Arrange
      const mockRequest = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('example.com'),
        originalUrl: '/api/users?page=1',
      };

      // Act
      const result = getFullUrl(mockRequest);

      // Assert
      expect(result).toBe('https://example.com/api/users?page=1');
      expect(mockRequest.get).toHaveBeenCalledWith('host');
    });

    it('should handle different protocols', () => {
      // Arrange
      const mockRequest = {
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/api/users',
      };

      // Act
      const result = getFullUrl(mockRequest);

      // Assert
      expect(result).toBe('http://localhost:3000/api/users');
      expect(mockRequest.get).toHaveBeenCalledWith('host');
    });

    it('should handle requests with query parameters', () => {
      // Arrange
      const mockRequest = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('api.example.com'),
        originalUrl: '/search?query=test&page=2&limit=10',
      };

      // Act
      const result = getFullUrl(mockRequest);

      // Assert
      expect(result).toBe('https://api.example.com/search?query=test&page=2&limit=10');
      expect(mockRequest.get).toHaveBeenCalledWith('host');
    });

    it('should handle root path', () => {
      // Arrange
      const mockRequest = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('example.org'),
        originalUrl: '/',
      };

      // Act
      const result = getFullUrl(mockRequest);

      // Assert
      expect(result).toBe('https://example.org/');
      expect(mockRequest.get).toHaveBeenCalledWith('host');
    });
  });
});
