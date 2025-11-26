import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sanitizeVideoUrl } from './urlSanitizer';

describe('sanitizeVideoUrl', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  describe('should allow blob URLs', () => {
    it('should allow standard blob URL format', () => {
      const blobUrl = 'blob:http://localhost:3000/abc-123-def-456';
      expect(sanitizeVideoUrl(blobUrl)).toBe(blobUrl);
    });

    it('should allow blob URL with https', () => {
      const blobUrl = 'blob:https://example.com/xyz-789';
      expect(sanitizeVideoUrl(blobUrl)).toBe(blobUrl);
    });

    it('should allow blob URL with different UUID format', () => {
      const blobUrl = 'blob:http://localhost/12345678-1234-1234-1234-123456789abc';
      expect(sanitizeVideoUrl(blobUrl)).toBe(blobUrl);
    });
  });

  describe('should block malicious URLs', () => {
    it('should block javascript: protocol', () => {
      const maliciousUrl = 'javascript:alert("XSS")';
      expect(sanitizeVideoUrl(maliciousUrl)).toBe('');
    });

    it('should block data: protocol', () => {
      const dataUrl = 'data:text/html,<script>alert("XSS")</script>';
      expect(sanitizeVideoUrl(dataUrl)).toBe('');
    });

    it('should block http: URLs', () => {
      const httpUrl = 'http://evil.com/video.mp4';
      expect(sanitizeVideoUrl(httpUrl)).toBe('');
    });

    it('should block https: URLs', () => {
      const httpsUrl = 'https://evil.com/video.mp4';
      expect(sanitizeVideoUrl(httpsUrl)).toBe('');
    });

    it('should block file: protocol', () => {
      const fileUrl = 'file:///etc/passwd';
      expect(sanitizeVideoUrl(fileUrl)).toBe('');
    });

    it('should block vbscript: protocol', () => {
      const vbscriptUrl = 'vbscript:msgbox("XSS")';
      expect(sanitizeVideoUrl(vbscriptUrl)).toBe('');
    });
  });

  describe('should handle invalid URLs', () => {
    it('should handle empty string', () => {
      expect(sanitizeVideoUrl('')).toBe('');
    });

    it('should handle malformed URL', () => {
      expect(sanitizeVideoUrl('not a url at all')).toBe('');
    });

    it('should handle null-like strings', () => {
      expect(sanitizeVideoUrl('null')).toBe('');
      expect(sanitizeVideoUrl('undefined')).toBe('');
    });

    it('should handle URLs with special characters that might break parsing', () => {
      expect(sanitizeVideoUrl('<script>alert(1)</script>')).toBe('');
    });
  });
});
