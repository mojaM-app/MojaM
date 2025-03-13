import * as config from '@config';
import {
  exportsForTesting,
  getAccessTokenExpiration,
  getAccessTokenSecret,
  getRefreshTokenExpiration,
  getRefreshTokenSecret,
  getTokenAudience,
  getTokenIssuer,
} from './set-identity.middleware';

describe('getRefreshTokenSecret', () => {
  it('should throw an error if REFRESH_TOKEN_SECRET is not set', () => {
    jest.replaceProperty(config, 'REFRESH_TOKEN_SECRET', '');
    expect(() => getRefreshTokenSecret(1, 'someKey')).toThrow('REFRESH_TOKEN_SECRET is not set. Go to the .env file and set it.');
  });

  it('should throw an error if userRefreshTokenKey is empty', () => {
    jest.replaceProperty(config, 'REFRESH_TOKEN_SECRET', 'someSecret');
    expect(() => getRefreshTokenSecret(1, '')).toThrow('User with id=1 has an empty RefreshTokenKey. Go to the database and set it.');
  });

  it('should return the correct refresh token secret', () => {
    jest.replaceProperty(config, 'REFRESH_TOKEN_SECRET', 'someSecret');
    const userRefreshTokenKey = 'userKey';
    const result = getRefreshTokenSecret(1, userRefreshTokenKey);
    expect(result).toBe('someSecret' + userRefreshTokenKey);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('getAccessTokenSecret', () => {
  it('should throw an error if ACCESS_TOKEN_SECRET is not set', () => {
    jest.replaceProperty(config, 'ACCESS_TOKEN_SECRET', '');
    expect(() => getAccessTokenSecret()).toThrow('ACCESS_TOKEN_SECRET is not set. Go to the .env file and set it.');
  });

  it('should return the correct access token secret', () => {
    jest.replaceProperty(config, 'ACCESS_TOKEN_SECRET', 'someSecret');
    const result = getAccessTokenSecret();
    expect(result).toBe('someSecret');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('getTokenAudience', () => {
  it('should throw an error if SECRET_AUDIENCE is not set', () => {
    jest.replaceProperty(config, 'SECRET_AUDIENCE', '');
    expect(() => getTokenAudience()).toThrow('SECRET_AUDIENCE is not set. Go to the .env file and set it.');
  });

  it('should return the correct token audience', () => {
    jest.replaceProperty(config, 'SECRET_AUDIENCE', 'someAudience');
    const result = getTokenAudience();
    expect(result).toBe('someAudience');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('getTokenIssuer', () => {
  it('should throw an error if SECRET_ISSUER is not set', () => {
    jest.replaceProperty(config, 'SECRET_ISSUER', '');
    expect(() => getTokenIssuer()).toThrow('SECRET_ISSUER is not set. Go to the .env file and set it.');
  });

  it('should return the correct token issuer', () => {
    jest.replaceProperty(config, 'SECRET_ISSUER', 'someIssuer');
    const result = getTokenIssuer();
    expect(result).toBe('someIssuer');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('getRefreshTokenExpiration', () => {
  it('should return the default refresh token expiration if REFRESH_TOKEN_EXPIRE_IN is not set', () => {
    jest.replaceProperty(config, 'REFRESH_TOKEN_EXPIRE_IN', '');
    const result = getRefreshTokenExpiration();
    expect(result).toBe('1d');
  });

  it('should return the correct refresh token expiration', () => {
    jest.replaceProperty(config, 'REFRESH_TOKEN_EXPIRE_IN', '2d');
    const result = getRefreshTokenExpiration();
    expect(result).toBe('2d');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('getAccessTokenExpiration', () => {
  it('should return the default access token expiration if ACCESS_TOKEN_EXPIRE_IN is not set', () => {
    const result = getAccessTokenExpiration();
    expect(result).toBe('10m');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('getAuthorization', () => {
  it('should return null if req is null', () => {
    const req = null;
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if req is undefined', () => {
    const req = undefined;
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if headers is null', () => {
    const req = {
      headers: null,
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if headers is undefined', () => {
    const req = {
      headers: null,
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if there is no authorization header', () => {
    const req = {
      headers: {},
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if the authorization header is null', () => {
    const req = {
      headers: {
        authorization: null,
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if the authorization header is undefined', () => {
    const req = {
      headers: {
        authorization: undefined,
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if the authorization header is an empty string', () => {
    const req = {
      headers: {
        authorization: '',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null if the Authorization header is an empty string', () => {
    const req = {
      headers: {
        Authorization: '',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return token from the authorization header', () => {
    const req = {
      headers: {
        authorization: 'Bearer token',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBe('token');
  });

  it('should return null when the authorization header does not starts with Bearer', () => {
    const req = {
      headers: {
        authorization: 'text and Bearer token',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null when there is no space between Bearer and token', () => {
    const req = {
      headers: {
        authorization: 'Bearertoken',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null when authorization header does not contain Bearer', () => {
    const req = {
      headers: {
        authorization: 'token',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return null when authorization header contain more than one Bearer', () => {
    const req = {
      headers: {
        authorization: 'Bearer Bearer token',
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBeNull();
  });

  it('should return first element when the authorization header is an array', () => {
    const req = {
      headers: {
        authorization: ['Bearer token'],
      },
    };
    const result = exportsForTesting.getAuthorization(req);
    expect(result).toBe('token');
  });
});
