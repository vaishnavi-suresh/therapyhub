import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TherapistDashboard from './TherapistDashboard';
import * as apiClient from '../api/client';

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

vi.mock('../api/client');

describe('TherapistDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    });
  });

  it('should render loading state', () => {
    vi.mocked(apiClient.apiFetch).mockImplementation(() => new Promise(() => {}));

    render(<TherapistDashboard therapistId="therapist1" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should render clients list', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([
      { user_id: 'client1', email: 'client1@example.com', first_name: 'Client', last_name: 'One' },
    ]);

    render(<TherapistDashboard therapistId="therapist1" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  it('should handle client selection', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([
      { user_id: 'client1', email: 'client1@example.com', first_name: 'Client', last_name: 'One' },
    ]);

    render(<TherapistDashboard therapistId="therapist1" />);
    
    await waitFor(() => {
      const clientButton = screen.getByText(/Client One/i);
      expect(clientButton).toBeInTheDocument();
    });
  });
});
