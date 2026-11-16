// Next inlines this flag from next.config.ts (trailingSlash: true) at build
// time; without it the test environment would strip the slash off /play/.
process.env.__NEXT_TRAILING_SLASH = 'true';
