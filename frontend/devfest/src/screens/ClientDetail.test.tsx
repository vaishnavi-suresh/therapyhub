import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientDetail from './ClientDetail';
import * as apiClient from '../api/client';

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

vi.mock('../api/client');
vi.mock('../components/VideoCall', () => ({
  default: () => <div>VideoCall Component</div>,
}));

describe('ClientDetail', () => {
  const mockClient = {
    user_id: 'client1',
    email: 'client@example.com',
    first_name: 'Client',
    last_name: 'One',
    last_activity: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    });
  });

  it('should render client information', () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([]);

    render(<ClientDetail client={mockClient} therapistId="therapist1" onBack={() => {}} />);
    
    expect(screen.getByText('Client One')).toBeInTheDocument();
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
  });

  it('should switch tabs', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([]);

    render(<ClientDetail client={mockClient} therapistId="therapist1" onBack={() => {}} />);
    
    const recordingsTab = screen.getByText('Recordings');
    await userEvent.click(recordingsTab);

    await waitFor(() => {
      expect(screen.getByText(/Recordings/i)).toBeInTheDocument();
    });
  });

  it('should handle back button', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([]);
    const mockOnBack = vi.fn();

    render(<ClientDetail client={mockClient} therapistId="therapist1" onBack={mockOnBack} />);
    
    const backButton = screen.getByText(/Back to clients/i);
    await userEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should delete recording', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([
        {
          meeting_id: 'rec1',
          recording_url: 'https://example.com/video.mp4',
          recording_created_at: new Date().toISOString(),
          transcript: 'Test transcript',
          analysis: 'Test analysis',
        },
      ])
      .mockResolvedValueOnce({}); // delete

    window.confirm = vi.fn(() => true);

    render(<ClientDetail client={mockClient} therapistId="therapist1" onBack={() => {}} />);
    
    const recordingsTab = screen.getByText('Recordings');
    await userEvent.click(recordingsTab);

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete');
      userEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(Object)
      );
    });
  });
});
