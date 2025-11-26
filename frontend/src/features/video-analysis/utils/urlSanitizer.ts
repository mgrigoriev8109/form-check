/**
 * Sanitizes a URL to prevent XSS attacks by only allowing blob URLs.
 * This is specifically for video URLs created by URL.createObjectURL()
 *
 * @param url - The URL to sanitize
 * @returns The original URL if it's a valid blob URL, empty string otherwise
 */
export function sanitizeVideoUrl(url: string): string {
  try {
    const parsedUrl = new URL(url, window.location.href);
    // Only allow blob URLs created by URL.createObjectURL
    if (parsedUrl.protocol === 'blob:') {
      return url;
    }
  } catch {
    // Invalid URL
  }
  return ''; // Return empty string for invalid URLs
}
