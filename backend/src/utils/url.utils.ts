import { type Request } from 'express';
import url from 'url';

const getFullUrl = (req: Request): string => {
  // Split the originalUrl to separate pathname from query parameters
  const urlParts = req.originalUrl.split('?');
  const [pathname] = urlParts;
  const query = urlParts.length > 1 ? urlParts.slice(1).join('?') : undefined;

  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname,
    search: (query?.length ?? 0) > 0 ? `?${query}` : undefined,
  });
};

export { getFullUrl };
