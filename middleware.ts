
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'bn', 'hi'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Always redirect to locale-prefixed paths
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(bn|hi|en)/:path*']
};
