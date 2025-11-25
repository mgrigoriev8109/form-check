/**
 * Unit tests for VideoUploader component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoUploader from './VideoUploader';

describe('VideoUploader', () => {
  let mockOnVideoSelected: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    // Mock the callback
    mockOnVideoSelected = vi.fn();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    mockCreateObjectURL = vi.fn((file: File) => `blob:mock-url-${file.name}`);
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Save original createElement
    originalCreateElement = document.createElement.bind(document);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // Helper function to setup video element mock with specific duration
  const setupVideoMock = (duration: number) => {
    const mockVideo = originalCreateElement('video');
    Object.defineProperty(mockVideo, 'duration', { value: duration, writable: true });

    // Spy on createElement and only mock video elements
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        return mockVideo;
      }
      return originalCreateElement(tagName);
    });

    return mockVideo;
  };

  describe('Initial Render', () => {
    it('should render exercise type selector with both options', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      expect(screen.getByText('Exercise Type')).toBeInTheDocument();
      expect(screen.getByText('Squat')).toBeInTheDocument();
      expect(screen.getByText('Deadlift')).toBeInTheDocument();
    });

    it('should have squat selected by default', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const squatButton = screen.getByText('Squat').closest('button')!;
      const deadliftButton = screen.getByText('Deadlift').closest('button')!;

      expect(squatButton).toHaveClass('bg-secondary');
      expect(deadliftButton).not.toHaveClass('bg-secondary');
    });

    it('should render upload area with correct text', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      expect(screen.getByText(/Drop your video here, or click to browse/)).toBeInTheDocument();
      expect(screen.getByText(/MP4 or MOV • Max 30 seconds • Max 100MB/)).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });

    it('should render video icon', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const svg = screen.getByText(/Drop your video here/).parentElement?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const errorContainer = document.querySelector('.bg-error\\/10');
      expect(errorContainer).not.toBeInTheDocument();
    });
  });

  describe('Exercise Type Selection', () => {
    it('should switch to deadlift when deadlift button is clicked', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const deadliftButton = screen.getByText('Deadlift').closest('button')!;
      await user.click(deadliftButton);

      expect(deadliftButton).toHaveClass('bg-secondary');
    });

    it('should switch back to squat when squat button is clicked', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      // First switch to deadlift
      const deadliftButton = screen.getByText('Deadlift').closest('button')!;
      await user.click(deadliftButton);

      // Then switch back to squat
      const squatButton = screen.getByText('Squat').closest('button')!;
      await user.click(squatButton);

      expect(squatButton).toHaveClass('bg-secondary');
      expect(deadliftButton).not.toHaveClass('bg-secondary');
    });

    it('should apply correct styles to selected exercise', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const squatButton = screen.getByText('Squat').closest('button')!;
      expect(squatButton).toHaveClass('bg-secondary', 'text-white', 'shadow-sm');
    });

    it('should apply correct styles to unselected exercise', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const deadliftButton = screen.getByText('Deadlift').closest('button')!;
      expect(deadliftButton).toHaveClass('bg-white', 'text-gray-700', 'border', 'border-gray-300');
    });
  });

  describe('File Input Handling', () => {
    it('should trigger file input when Choose File button is clicked', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const chooseFileButton = screen.getByText('Choose File');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      await user.click(chooseFileButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should accept valid MP4 file', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      // Simulate file selection
      await user.upload(fileInput, mockFile);

      // Trigger loadedmetadata event
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalledWith(mockFile, 'squat');
      });
    });

    it('should accept valid MOV file', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'test-video.mov', { type: 'video/quicktime' });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalledWith(mockFile, 'squat');
      });
    });

    it('should pass correct exercise type when deadlift is selected', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      // Select deadlift
      const deadliftButton = screen.getByText('Deadlift').closest('button')!;
      await user.click(deadliftButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalledWith(mockFile, 'deadlift');
      });
    });

    it('should create object URL for valid file', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      await user.upload(fileInput, mockFile);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    });

    it('should have correct file input attributes', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'video/mp4,video/quicktime,video/x-m4v');
      expect(fileInput).toHaveClass('hidden');
    });
  });

  describe('File Validation - Format', () => {
    it('should reject invalid file format', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'test-video.avi', { type: 'video/avi' });

      // Manually trigger file input change
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });
      fireEvent.change(fileInput);

      expect(screen.getByText('Please upload a .mp4 or .mov file')).toBeInTheDocument();
      expect(mockOnVideoSelected).not.toHaveBeenCalled();
    });

    it('should display error message for invalid format in error container', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'test.avi', { type: 'video/avi' });

      // Manually trigger file input change
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });
      fireEvent.change(fileInput);

      const errorElement = screen.getByText('Please upload a .mp4 or .mov file');
      expect(errorElement).toHaveClass('text-error-dark');
      expect(errorElement.closest('div')).toHaveClass('bg-error/10');
    });
  });

  describe('File Validation - Size', () => {
    it('should reject file larger than 100MB', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Create a file with size > 100MB
      const largeFileSize = 101 * 1024 * 1024;
      const mockFile = new File(['x'.repeat(largeFileSize)], 'large-video.mp4', {
        type: 'video/mp4'
      });

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('File size must be less than 100MB')).toBeInTheDocument();
      });

      expect(mockOnVideoSelected).not.toHaveBeenCalled();
    });

    it('should accept file smaller than 100MB', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const smallFileSize = 50 * 1024 * 1024;
      const mockFile = new File(['x'.repeat(smallFileSize)], 'small-video.mp4', {
        type: 'video/mp4'
      });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalled();
      });
    });

    it('should accept file exactly at 100MB limit', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const exactSize = 100 * 1024 * 1024;
      const mockFile = new File(['x'.repeat(exactSize)], 'exact-video.mp4', {
        type: 'video/mp4'
      });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalled();
      });
    });
  });

  describe('Video Duration Validation', () => {
    it('should reject video longer than 30 seconds', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'long-video.mp4', { type: 'video/mp4' });

      // Mock video element with long duration
      const mockVideo = setupVideoMock(45);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(screen.getByText(/Video must be 30 seconds or less/)).toBeInTheDocument();
        expect(screen.getByText(/Your video is 45 seconds/)).toBeInTheDocument();
      });

      expect(mockOnVideoSelected).not.toHaveBeenCalled();
    });

    it('should accept video shorter than 30 seconds', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'short-video.mp4', { type: 'video/mp4' });

      // Mock video element with short duration
      const mockVideo = setupVideoMock(15);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalled();
      });
    });

    it('should accept video exactly at 30 second limit', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'exact-video.mp4', { type: 'video/mp4' });

      // Mock video element with exact duration
      const mockVideo = setupVideoMock(30);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalled();
      });
    });

    it('should round duration in error message', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'video.mp4', { type: 'video/mp4' });

      // Mock video element with decimal duration
      const mockVideo = setupVideoMock(45.7);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(screen.getByText(/Your video is 46 seconds/)).toBeInTheDocument();
      });
    });

    it('should revoke object URL when duration check fails', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['video content'], 'video.mp4', { type: 'video/mp4' });

      // Mock video element
      const mockVideo = setupVideoMock(45);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith(`blob:mock-url-video.mp4`);
      });
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle drag enter event', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const dropArea = screen.getByText(/Drop your video here/).closest('div')!;

      // Simulate drag enter
      fireEvent.dragEnter(dropArea);

      expect(dropArea).toHaveClass('border-secondary-light', 'bg-secondary/10');
    });

    it('should handle drag over event', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const dropArea = screen.getByText(/Drop your video here/).closest('div')!;

      // Simulate drag over
      fireEvent.dragOver(dropArea);

      expect(dropArea).toHaveClass('border-secondary-light', 'bg-secondary/10');
    });

    it('should handle drag leave event', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const dropArea = screen.getByText(/Drop your video here/).closest('div')!;

      // First drag enter
      fireEvent.dragEnter(dropArea);

      // Then drag leave
      fireEvent.dragLeave(dropArea);

      expect(dropArea).not.toHaveClass('border-secondary-light');
      expect(dropArea).toHaveClass('border-gray-300');
    });

    it('should handle file drop', async () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const dropArea = screen.getByText(/Drop your video here/).closest('div')!;
      const mockFile = new File(['video content'], 'dropped-video.mp4', { type: 'video/mp4' });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      // Simulate file drop
      fireEvent.drop(dropArea, {
        dataTransfer: {
          files: [mockFile]
        }
      });
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalledWith(mockFile, 'squat');
      });
    });

    it('should reset drag state after drop', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const dropArea = screen.getByText(/Drop your video here/).closest('div')!;

      // First set drag active
      fireEvent.dragEnter(dropArea);

      // Then drop
      fireEvent.drop(dropArea, {
        dataTransfer: {
          files: []
        }
      });

      expect(dropArea).not.toHaveClass('border-secondary-light');
    });

    it('should validate dropped file format', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const dropArea = screen.getByText(/Drop your video here/).closest('div')!;
      const mockFile = new File(['video content'], 'video.avi', { type: 'video/avi' });

      // Simulate dropping invalid file
      fireEvent.drop(dropArea, {
        dataTransfer: {
          files: [mockFile]
        }
      });

      expect(screen.getByText('Please upload a .mp4 or .mov file')).toBeInTheDocument();
      expect(mockOnVideoSelected).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should clear previous error when new valid file is selected', async () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // First upload invalid file
      const invalidFile = new File(['content'], 'video.avi', { type: 'video/avi' });
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
        configurable: true
      });
      fireEvent.change(fileInput);

      expect(screen.getByText('Please upload a .mp4 or .mov file')).toBeInTheDocument();

      // Then upload valid file
      const validFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });
      const mockVideo = setupVideoMock(10);

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
        configurable: true
      });
      fireEvent.change(fileInput);

      // Error should be cleared before validation
      expect(screen.queryByText('Please upload a .mp4 or .mov file')).not.toBeInTheDocument();
    });

    it('should show only the most recent error', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // First upload wrong format
      const wrongFormat = new File(['content'], 'video.avi', { type: 'video/avi' });
      Object.defineProperty(fileInput, 'files', {
        value: [wrongFormat],
        writable: false,
        configurable: true
      });
      fireEvent.change(fileInput);

      expect(screen.getByText('Please upload a .mp4 or .mov file')).toBeInTheDocument();

      // Then upload too large file
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.mp4', {
        type: 'video/mp4'
      });
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
        configurable: true
      });
      fireEvent.change(fileInput);

      expect(screen.getByText('File size must be less than 100MB')).toBeInTheDocument();
      expect(screen.queryByText('Please upload a .mp4 or .mov file')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null file selection', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate selecting no file (e.g., clicking cancel in file dialog)
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      expect(mockOnVideoSelected).not.toHaveBeenCalled();
    });

    it('should handle multiple file selections by using only the first file', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = new File(['content1'], 'video1.mp4', { type: 'video/mp4' });
      const file2 = new File(['content2'], 'video2.mp4', { type: 'video/mp4' });

      // Mock video element
      const mockVideo = setupVideoMock(10);

      // Simulate selecting multiple files (though input doesn't have multiple attribute)
      await user.upload(fileInput, [file1, file2]);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      await waitFor(() => {
        // Should only process the first file
        expect(mockOnVideoSelected).toHaveBeenCalledWith(file1, 'squat');
        expect(mockOnVideoSelected).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle rapid exercise type changes', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const squatButton = screen.getByText('Squat').closest('button')!;
      const deadliftButton = screen.getByText('Deadlift').closest('button')!;

      // Rapidly switch between exercise types
      await user.click(deadliftButton);
      await user.click(squatButton);
      await user.click(deadliftButton);
      await user.click(squatButton);

      expect(squatButton).toHaveClass('bg-secondary');
      expect(deadliftButton).not.toHaveClass('bg-secondary');
    });

    it('should handle video element creation', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });

      const mockVideo = setupVideoMock(10);

      await user.upload(fileInput, mockFile);

      expect(document.createElement).toHaveBeenCalledWith('video');
      expect(mockVideo.src).toBe(`blob:mock-url-video.mp4`);
    });

    it('should handle video with zero duration', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });

      const mockVideo = setupVideoMock(0);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      // Duration of 0 should be accepted (it's less than 30 seconds)
      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for exercise type', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const label = screen.getByText('Exercise Type');
      expect(label).toHaveClass('text-sm', 'font-medium');
    });

    it('should have clickable buttons for exercise selection', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const squatButton = screen.getByText('Squat').closest('button')!;
      const deadliftButton = screen.getByText('Deadlift').closest('button')!;

      expect(squatButton.tagName).toBe('BUTTON');
      expect(deadliftButton.tagName).toBe('BUTTON');
    });

    it('should have file input with correct accept attribute', () => {
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.accept).toBe('video/mp4,video/quicktime,video/x-m4v');
    });
  });

  describe('Integration', () => {
    it('should complete full happy path flow', async () => {
      const user = userEvent.setup();
      render(<VideoUploader onVideoSelected={mockOnVideoSelected} />);

      // 1. Select deadlift exercise
      const deadliftButton = screen.getByText('Deadlift').closest('button')!;
      await user.click(deadliftButton);

      // 2. Upload valid video file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'my-deadlift.mp4', { type: 'video/mp4' });

      const mockVideo = document.createElement('video');
      Object.defineProperty(mockVideo, 'duration', { value: 15, writable: true });
      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);

      await user.upload(fileInput, mockFile);
      mockVideo.onloadedmetadata?.(new Event('loadedmetadata'));

      // 3. Verify callback is called with correct parameters
      await waitFor(() => {
        expect(mockOnVideoSelected).toHaveBeenCalledWith(mockFile, 'deadlift');
        expect(mockOnVideoSelected).toHaveBeenCalledTimes(1);
      });

      // 4. Verify no errors are shown
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});
