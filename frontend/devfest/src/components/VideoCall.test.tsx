import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoCall from './VideoCall';
import * as apiClient from '../api/client';

vi.mock('../api/client');
vi.mock('@videosdk.live/react-sdk', () => ({
  MeetingProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMeeting: vi.fn(),
  useParticipant: vi.fn(),
  VideoPlayer: () => <div data-testid="video-player">Video Player</div>,
}));

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

describe('VideoCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    });
  });

  it('should render join screen for therapist', () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue({
      meetingId: 'room1',
      token: 'token1',
    });

    render(<VideoCall therapistId="therapist1" userRole="therapist" />);
    expect(screen.getByText('Video Conference')).toBeInTheDocument();
    expect(screen.getByText('Start New Session')).toBeInTheDocument();
  });

  it('should render join screen for client', () => {
    render(<VideoCall clientId="client1" userRole="user" />);
    expect(screen.getByText('Video Conference')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Meeting ID/i)).toBeInTheDocument();
  });

  it('should handle create meeting', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue({
      meetingId: 'room123',
      token: 'token123',
    });

    render(<VideoCall therapistId="therapist1" userRole="therapist" />);
    
    const createButton = screen.getByText('Start New Session');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalled();
    });
  });

  it('should handle join meeting', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce({}) // validate
      .mockResolvedValueOnce({ token: 'token123' }); // token

    render(<VideoCall clientId="client1" userRole="user" />);
    
    const input = screen.getByPlaceholderText(/Enter Meeting ID/i);
    await userEvent.type(input, 'room123');
    
    const joinButton = screen.getByText('Join Session');
    await userEvent.click(joinButton);

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalled();
    });
  });
});
