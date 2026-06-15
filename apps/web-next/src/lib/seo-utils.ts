/**
 * Checks if a given URL is a non-user-facing page (assets, API endpoints, feeds, sitemaps, etc.)
 */
export function isNonUserPage(url: string | null | undefined): boolean {
  if (!url) return true;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  
  // 1. File extension check
  const assetExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
    ".css", ".js", ".json", ".xml", ".txt",
    ".pdf", ".zip", ".rar", ".tar", ".gz",
    ".mp4", ".mp3", ".wav", ".avi", ".mov",
    ".woff", ".woff2", ".ttf", ".eot",
    ".md"
  ];
  if (assetExtensions.some(ext => clean.endsWith(ext) || clean.includes(ext + "/"))) {
    return true;
  }

  // 2. Specific path/keyword checks for non-user pages
  const nonUserKeywords = [
    "/wp-json",
    "/feed",
    "/rss",
    "/atom",
    "sitemap",
    "xmlrpc.php",
    "/wp-admin",
    "/wp-includes",
    "/wp-content"
  ];
  
  if (nonUserKeywords.some(kw => clean.includes(kw))) {
    return true;
  }

  return false;
}
