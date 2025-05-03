import url from 'url';

const getFullUrl = (req: any): string => {
  // Split the originalUrl to separate pathname from query parameters
  const urlParts = req.originalUrl.split('?');
  const pathname = urlParts[0];
  const query = urlParts.length > 1 ? urlParts.slice(1).join('?') : undefined;

  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname,
    search: query ? `?${query}` : undefined,
  });
};

export { getFullUrl };
