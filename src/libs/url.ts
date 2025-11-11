/**
 * Get the base URL for the application including any base path
 * e.g., for GitHub Pages: https://billboardbit.github.io/billboardbit
 */
export function getBaseUrl(): string {
  const { protocol, host } = window.location;
  const basePath = import.meta.env.BASE_URL || '/';
  
  // Remove trailing slash from base path if it exists
  const cleanBasePath = basePath.endsWith('/') && basePath.length > 1 
    ? basePath.slice(0, -1) 
    : basePath;
  
  return `${protocol}//${host}${cleanBasePath === '/' ? '' : cleanBasePath}`;
}

/**
 * Get full URL for a given path
 * @param path - The path to append (with or without leading slash)
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
