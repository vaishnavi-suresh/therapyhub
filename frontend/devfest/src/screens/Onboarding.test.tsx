import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Onboarding from './Onboarding';
import * as apiClient from '../api/client';

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

vi.mock('../api/client');

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth0.mockReturnValue({
      user: { email: 'test@example.com' },
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    });
  });

  it('should render onboarding form', () => {
    render(<Onboarding />);
    expect(screen.getByText(/Complete your profile/i)).toBeInTheDocument();
  });

  it('should show error if name is missing', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([]);

    render(<Onboarding />);
    
    const submitButton = screen.getByText(/Complete/i);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter your name/i)).toBeInTheDocument();
    });
  });

  it('should submit form for client role', async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([]) // therapists
      .mockResolvedValueOnce({ user_id: 'user1' }); // create user

    render(<Onboarding />);
    
    const nameInput = screen.getByPlaceholderText(/Your full name/i);
    await userEvent.type(nameInput, 'John Doe');

    const submitButton = screen.getByText(/Complete/i);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalled();
    });
  });

  it('should submit form for therapist role', async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue({ user_id: 'therapist1' });

    render(<Onboarding />);
    
    const therapistRadio = screen.getByLabelText(/I am a therapist/i);
    await userEvent.click(therapistRadio);

    const nameInput = screen.getByPlaceholderText(/Your full name/i);
    await userEvent.type(nameInput, 'Dr. Smith');

    const submitButton = screen.getByText(/Complete/i);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalled();
    });
  });
});
