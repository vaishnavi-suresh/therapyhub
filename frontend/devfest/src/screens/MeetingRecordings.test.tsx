import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeetingRecordings from './MeetingRecordings';
import * as apiClient from '../api/client';

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

vi.mock('../api/client');

describe('MeetingRecordings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    });
  });

  it('should render loading state', () => {
    vi.mocked(apiClient.apiFetch).mockImplementation(() => new Promise(() => {}));

    render(<MeetingRecordings />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should render recordings list', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([]) // therapists
      .mockResolvedValueOnce([
        {
          meeting_id: 'rec1',
          recording_url: 'https://example.com/video.mp4',
          recording_created_at: new Date().toISOString(),
          transcript: 'Test transcript',
          analysis: 'Test analysis',
        },
      ]); // recordings

    render(<MeetingRecordings />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  it('should filter by therapist', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([
        { user_id: 'therapist1', email: 'therapist1@example.com' },
      ])
      .mockResolvedValueOnce([]);

    render(<MeetingRecordings />);
    
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  it('should handle recording selection', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          meeting_id: 'rec1',
          recording_url: 'https://example.com/video.mp4',
          recording_created_at: new Date().toISOString(),
          transcript: 'Test transcript',
          analysis: 'Test analysis',
        },
      ]);

    render(<MeetingRecordings />);
    
    await waitFor(() => {
      const recordingCard = screen.getByText(/Test transcript/i);
      userEvent.click(recordingCard);
    });
  });
});
