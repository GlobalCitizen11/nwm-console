const CONSOLE_BASE_PATH = "/nwm-console";

const normalizePathname = (pathname: string) => {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
};

const matchesPathPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const getConsoleBasePath = (pathname: string) => {
  const normalizedPathname = normalizePathname(pathname);
  return matchesPathPrefix(normalizedPathname, CONSOLE_BASE_PATH) ? CONSOLE_BASE_PATH : "";
};

export const isExportPreviewRoute = (pathname: string) => {
  const normalizedPathname = normalizePathname(pathname);
  const exportPrefix = `${getConsoleBasePath(normalizedPathname)}/export`;
  return matchesPathPrefix(normalizedPathname, exportPrefix);
};

export const buildConsoleRoute = (pathname: string, routePath: string) => {
  const normalizedRoutePath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${getConsoleBasePath(pathname)}${normalizedRoutePath}`;
};
