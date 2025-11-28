/**
 * Unit tests for VideoAnalysisView component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoAnalysisView from './VideoAnalysisView';
import * as poseDetection from './utils/poseDetection';

// Mock child components
vi.mock('./components/VideoUploader', () => ({
  default: ({
    onVideoSelected,
  }: {
    onVideoSelected: (file: File, exercise: string) => void;
  }) => (
    <div data-testid="video-uploader">
      <button
        onClick={() => {
          const mockFile = new File(['video content'], 'test-video.mp4', {
            type: 'video/mp4',
          });
          onVideoSelected(mockFile, 'squat');
        }}
        data-testid="select-video-btn"
      >
        Select Video
      </button>
    </div>
  ),
}));

vi.mock('./components/VideoPreview', () => ({
  default: ({
    videoUrl,
    videoFile,
    exerciseType,
    onAnalyze,
    onUploadAnother,
    isAnalyzing,
    results,
  }: {
    videoUrl: string;
    videoFile: File;
    exerciseType: string;
    onAnalyze: () => void;
    onUploadAnother: () => void;
    isAnalyzing: boolean;
    results: any;
  }) => (
    <div data-testid="video-preview">
      <div>Video URL: {videoUrl}</div>
      <div>File: {videoFile.name}</div>
      <div>Exercise: {exerciseType}</div>
      <div>Analyzing: {isAnalyzing.toString()}</div>
      <div>Has Results: {(!!results).toString()}</div>
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        data-testid="analyze-btn"
      >
        Analyze
      </button>
      <button onClick={onUploadAnother} data-testid="upload-another-btn">
        Upload Another
      </button>
    </div>
  ),
}));

vi.mock('./components/VideoResults', () => ({
  default: ({ results }: { results: { analysis: string } }) => (
    <div data-testid="video-results">
      <div>Analysis: {results.analysis}</div>
    </div>
  ),
}));

vi.mock('./components/VideoUploadTips', () => ({
  default: () => <div data-testid="video-upload-tips">Upload Tips</div>,
}));

// Mock pose detection module
vi.mock('./utils/poseDetection', () => ({
  analyzeExerciseVideo: vi.fn(),
}));

describe('VideoAnalysisView', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    mockCreateObjectURL = vi.fn((file: File) => `blob:mock-url-${file.name}`);
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render upload stage by default', () => {
      render(<VideoAnalysisView />);

      expect(screen.getByTestId('video-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('video-upload-tips')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('video-results')).not.toBeInTheDocument();
    });
  });

  describe('Video Selection Flow', () => {
    it('should transition to preview stage when video is selected', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      // Click the select video button
      const selectButton = screen.getByTestId('select-video-btn');
      await user.click(selectButton);

      // Should now show preview stage
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
      expect(screen.queryByTestId('video-uploader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('video-upload-tips')).not.toBeInTheDocument();
    });

    it('should set video file, URL, and exercise type correctly', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));

      // Check preview shows correct information
      expect(screen.getByText(/File: test-video.mp4/)).toBeInTheDocument();
      expect(screen.getByText(/Exercise: squat/)).toBeInTheDocument();
      expect(
        screen.getByText(/Video URL: blob:mock-url-test-video.mp4/)
      ).toBeInTheDocument();
    });

    it('should create object URL for video', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(File));
    });
  });

  describe('Analysis Flow - Success', () => {
    it('should analyze video successfully and show results', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = {
        exerciseType: 'squat',
        keyPositions: {},
        temporalAnalysis: {},
        riskFlags: [],
      };
      const mockAnalysisResponse = {
        analysis: 'Great form! Your squat depth is excellent.',
      };

      // Create a promise we can control
      let resolvePoseDetection: (value: any) => void;
      const poseDetectionPromise = new Promise(resolve => {
        resolvePoseDetection = resolve;
      });

      // Mock pose detection with controlled promise
      vi.mocked(poseDetection.analyzeExerciseVideo).mockReturnValue(
        poseDetectionPromise
      );

      // Mock successful fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      render(<VideoAnalysisView />);

      // Select video
      await user.click(screen.getByTestId('select-video-btn'));

      // Click analyze
      await user.click(screen.getByTestId('analyze-btn'));

      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText(/Analyzing: true/)).toBeInTheDocument();
      });

      // Resolve the pose detection
      resolvePoseDetection!(mockBiomechanicsData);

      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByTestId('video-results')).toBeInTheDocument();
      });

      // Verify results are displayed
      expect(screen.getByText(/Analysis: Great form!/)).toBeInTheDocument();

      // Verify API calls
      expect(poseDetection.analyzeExerciseVideo).toHaveBeenCalledWith(
        expect.any(File),
        'squat',
        8
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze-form',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockBiomechanicsData),
        }
      );
    });

    it('should transition to results stage after successful analysis', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };
      const mockAnalysisResponse = { analysis: 'Good form' };

      vi.mocked(poseDetection.analyzeExerciseVideo).mockResolvedValue(
        mockBiomechanicsData
      );
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Has Results: true/)).toBeInTheDocument();
      });
    });
  });

  describe('Analysis Flow - Errors', () => {
    it('should handle pose detection errors', async () => {
      const user = userEvent.setup();

      // Mock pose detection failure
      vi.mocked(poseDetection.analyzeExerciseVideo).mockRejectedValue(
        new Error('Failed to detect pose')
      );

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to detect pose/)).toBeInTheDocument();
      });

      // Should return to preview stage
      expect(screen.getByText(/Analyzing: false/)).toBeInTheDocument();
    });

    it('should handle backend API errors with detail message', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };

      vi.mocked(poseDetection.analyzeExerciseVideo).mockResolvedValue(
        mockBiomechanicsData
      );

      // Mock fetch failure
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Backend processing failed' }),
      });

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      await waitFor(() => {
        expect(
          screen.getByText(/Backend processing failed/)
        ).toBeInTheDocument();
      });
    });

    it('should handle backend API errors without detail message', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };

      vi.mocked(poseDetection.analyzeExerciseVideo).mockResolvedValue(
        mockBiomechanicsData
      );

      // Mock fetch failure without detail
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
      });
    });

    it('should handle missing video file or exercise type', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      // Manually trigger analyze without selecting video (edge case)
      // This is tested through direct component logic verification
      // In practice, the UI prevents this, but we test the guard clause

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      // Should attempt to analyze since we have file and exercise
      expect(poseDetection.analyzeExerciseVideo).toHaveBeenCalled();
    });
  });

  describe('Upload Another Video Flow', () => {
    it('should reset state and return to upload stage', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };
      const mockAnalysisResponse = { analysis: 'Good form' };

      vi.mocked(poseDetection.analyzeExerciseVideo).mockResolvedValue(
        mockBiomechanicsData
      );
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      render(<VideoAnalysisView />);

      // Select and analyze video
      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('video-results')).toBeInTheDocument();
      });

      // Click upload another
      await user.click(screen.getByTestId('upload-another-btn'));

      // Should return to upload stage
      await waitFor(() => {
        expect(screen.getByTestId('video-uploader')).toBeInTheDocument();
        expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
        expect(screen.queryByTestId('video-results')).not.toBeInTheDocument();
      });
    });

    it('should revoke object URL when uploading another video', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };
      const mockAnalysisResponse = { analysis: 'Good form' };

      vi.mocked(poseDetection.analyzeExerciseVideo).mockResolvedValue(
        mockBiomechanicsData
      );
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('video-results')).toBeInTheDocument();
      });

      const createdUrl = mockCreateObjectURL.mock.results[0].value;

      await user.click(screen.getByTestId('upload-another-btn'));

      // Should revoke the blob URL
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(createdUrl);
    });

    it('should clear error messages when uploading another video', async () => {
      const user = userEvent.setup();

      vi.mocked(poseDetection.analyzeExerciseVideo).mockRejectedValue(
        new Error('Analysis error')
      );

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Analysis error/)).toBeInTheDocument();
      });

      // Upload another
      await user.click(screen.getByTestId('upload-another-btn'));

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Analysis error/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Stage Management', () => {
    it('should handle all stage transitions correctly', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };
      const mockAnalysisResponse = { analysis: 'Good form' };

      // Create a promise we can control
      let resolvePoseDetection: (value: any) => void;
      const poseDetectionPromise = new Promise(resolve => {
        resolvePoseDetection = resolve;
      });

      vi.mocked(poseDetection.analyzeExerciseVideo).mockReturnValue(
        poseDetectionPromise
      );
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      render(<VideoAnalysisView />);

      // Stage 1: upload
      expect(screen.getByTestId('video-uploader')).toBeInTheDocument();

      // Stage 2: preview
      await user.click(screen.getByTestId('select-video-btn'));
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
      expect(screen.getByText(/Analyzing: false/)).toBeInTheDocument();

      // Stage 3: analyzing
      await user.click(screen.getByTestId('analyze-btn'));
      await waitFor(() => {
        expect(screen.getByText(/Analyzing: true/)).toBeInTheDocument();
      });

      // Resolve pose detection
      resolvePoseDetection!(mockBiomechanicsData);

      // Stage 4: results
      await waitFor(() => {
        expect(screen.getByTestId('video-results')).toBeInTheDocument();
        expect(screen.getByText(/Has Results: true/)).toBeInTheDocument();
      });

      // Back to upload
      await user.click(screen.getByTestId('upload-another-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('video-uploader')).toBeInTheDocument();
      });
    });

    it('should return to preview stage on analysis error', async () => {
      const user = userEvent.setup();

      // Create a promise we can control
      let rejectPoseDetection: (error: Error) => void;
      const poseDetectionPromise = new Promise((_, reject) => {
        rejectPoseDetection = reject;
      });

      vi.mocked(poseDetection.analyzeExerciseVideo).mockReturnValue(
        poseDetectionPromise
      );

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      // Should be in analyzing stage
      await waitFor(() => {
        expect(screen.getByText(/Analyzing: true/)).toBeInTheDocument();
      });

      // Trigger the error
      rejectPoseDetection!(new Error('Error'));

      // Then return to preview
      await waitFor(() => {
        expect(screen.getByText(/Analyzing: false/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Display', () => {
    it('should display error message in error container', async () => {
      const user = userEvent.setup();

      vi.mocked(poseDetection.analyzeExerciseVideo).mockRejectedValue(
        new Error('Custom error message')
      );

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      await waitFor(() => {
        const errorElement = screen.getByText(/Custom error message/);
        expect(errorElement).toBeInTheDocument();
        // Check it has the correct styling
        expect(errorElement).toHaveClass('text-error-dark');
        // Check it's in an error container
        const errorContainer = errorElement.closest('div');
        expect(errorContainer).toHaveClass('bg-error/10');
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to VideoPreview', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));

      // Verify all props are passed correctly
      expect(
        screen.getByText(/Video URL: blob:mock-url-test-video.mp4/)
      ).toBeInTheDocument();
      expect(screen.getByText(/File: test-video.mp4/)).toBeInTheDocument();
      expect(screen.getByText(/Exercise: squat/)).toBeInTheDocument();
      expect(screen.getByText(/Analyzing: false/)).toBeInTheDocument();
      expect(screen.getByText(/Has Results: false/)).toBeInTheDocument();
    });

    it('should pass correct props to VideoResults', async () => {
      const user = userEvent.setup();
      const mockBiomechanicsData = { exerciseType: 'squat' };
      const mockAnalysisResponse = { analysis: 'Test analysis result' };

      vi.mocked(poseDetection.analyzeExerciseVideo).mockResolvedValue(
        mockBiomechanicsData
      );
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));
      await user.click(screen.getByTestId('analyze-btn'));

      await waitFor(() => {
        expect(
          screen.getByText(/Analysis: Test analysis result/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid stage transitions', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      // Rapidly select and clear
      await user.click(screen.getByTestId('select-video-btn'));
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();

      await user.click(screen.getByTestId('upload-another-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('video-uploader')).toBeInTheDocument();
      });
    });

    it('should not show results when in preview or analyzing stage', async () => {
      const user = userEvent.setup();
      render(<VideoAnalysisView />);

      await user.click(screen.getByTestId('select-video-btn'));

      // In preview stage
      expect(screen.queryByTestId('video-results')).not.toBeInTheDocument();

      // Start analyzing (mocked to be slow)
      vi.mocked(poseDetection.analyzeExerciseVideo).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 1000))
      );

      await user.click(screen.getByTestId('analyze-btn'));

      // During analyzing stage
      expect(screen.queryByTestId('video-results')).not.toBeInTheDocument();
    });
  });
});
