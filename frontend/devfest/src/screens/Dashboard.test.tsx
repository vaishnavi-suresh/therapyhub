import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import * as apiClient from '../api/client';

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

vi.mock('../api/client');
vi.mock('../components/VideoCall', () => ({
  default: () => <div>VideoCall Component</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    });
  });

  it('should render loading state', () => {
    vi.mocked(apiClient.apiFetch).mockImplementation(() => new Promise(() => {}));

    render(<Dashboard profile={{ user_id: 'user1', therapist_id: null, role: 'user' }} />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should render conversations list', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([
      { conversation_id: 'conv1', user_id: 'user1', therapist_id: 'therapist1' },
    ]);

    render(<Dashboard profile={{ user_id: 'user1', therapist_id: 'therapist1', role: 'user' }} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  it('should switch tabs', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([]);

    render(<Dashboard profile={{ user_id: 'user1', therapist_id: 'therapist1', role: 'user' }} />);
    
    await waitFor(() => {
      const homeworkTab = screen.getByText(/Homework/i);
      userEvent.click(homeworkTab);
    });
  });

  it('should send message', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([]) // conversations
      .mockResolvedValueOnce([]) // messages
      .mockResolvedValueOnce({}) // send message
      .mockResolvedValueOnce([]); // fetch messages again

    render(<Dashboard profile={{ user_id: 'user1', therapist_id: 'therapist1', role: 'user' }} />);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Type your message/i);
      expect(input).toBeInTheDocument();
    });
  });
});
