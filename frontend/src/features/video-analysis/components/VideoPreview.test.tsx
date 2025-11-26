import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoPreview from './VideoPreview';

describe('VideoPreview', () => {
  const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
  const mockOnAnalyze = vi.fn();
  const mockOnUploadAnother = vi.fn();

  const defaultProps = {
    videoFile: mockFile,
    exerciseType: 'squat',
    onAnalyze: mockOnAnalyze,
    onUploadAnother: mockOnUploadAnother,
    isAnalyzing: false,
    results: null,
  };

  describe('URL Sanitization - XSS Protection', () => {
    it('should render video with valid blob URL', () => {
      const blobUrl = 'blob:http://localhost:3000/abc-123';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={blobUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      expect(videoElement.src).toBe(blobUrl);
    });

    it('should block javascript: protocol XSS attempt', () => {
      const maliciousUrl = 'javascript:alert("XSS")';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={maliciousUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      // Should be empty or current page URL, not the malicious URL
      expect(videoElement.src).not.toContain('javascript:');
      expect(videoElement.src).not.toContain('alert');
    });

    it('should block data: protocol XSS attempt', () => {
      const maliciousUrl = 'data:text/html,<script>alert("XSS")</script>';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={maliciousUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      expect(videoElement.src).not.toContain('data:');
      expect(videoElement.src).not.toContain('script');
    });

    it('should block http: URLs to prevent loading external content', () => {
      const externalUrl = 'http://evil.com/malicious.mp4';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={externalUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      expect(videoElement.src).not.toBe(externalUrl);
    });

    it('should block https: URLs to prevent loading external content', () => {
      const externalUrl = 'https://evil.com/malicious.mp4';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={externalUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      expect(videoElement.src).not.toBe(externalUrl);
    });

    it('should handle empty URL gracefully', () => {
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl="" />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      // Should have empty or safe src
      expect(videoElement.src).not.toContain('javascript:');
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = 'not a url at all';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={malformedUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      // Should sanitize to safe value
      expect(videoElement.src).toBeDefined();
    });
  });

  describe('Component Rendering', () => {
    it('should render video player with controls', () => {
      const blobUrl = 'blob:http://localhost:3000/test-video';
      const { container } = render(
        <VideoPreview {...defaultProps} videoUrl={blobUrl} />
      );

      const videoElement = container.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toBeTruthy();
      expect(videoElement.controls).toBe(true);
    });

    it('should display file information when no results', () => {
      const blobUrl = 'blob:http://localhost:3000/test-video';
      render(<VideoPreview {...defaultProps} videoUrl={blobUrl} />);

      expect(screen.getByText('test.mp4')).toBeTruthy();
      expect(screen.getByText(/Squat/)).toBeTruthy();
    });

    it('should show Analyze Form button when not analyzing and no results', () => {
      const blobUrl = 'blob:http://localhost:3000/test-video';
      render(<VideoPreview {...defaultProps} videoUrl={blobUrl} />);

      expect(screen.getByText('Analyze Form')).toBeTruthy();
    });

    it('should show analyzing state when isAnalyzing is true', () => {
      const blobUrl = 'blob:http://localhost:3000/test-video';
      render(
        <VideoPreview {...defaultProps} videoUrl={blobUrl} isAnalyzing={true} />
      );

      expect(screen.getByText('Analyzing...')).toBeTruthy();
    });

    it('should show Upload Another Video button when results exist', () => {
      const blobUrl = 'blob:http://localhost:3000/test-video';
      render(
        <VideoPreview
          {...defaultProps}
          videoUrl={blobUrl}
          results={{ analysis: 'test results' }}
        />
      );

      expect(screen.getByText('Upload Another Video')).toBeTruthy();
    });
  });
});
