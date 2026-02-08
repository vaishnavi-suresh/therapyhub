import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as apiClient from './api/client';

vi.mock('./api/client');

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const { useAuth0 } = require('@auth0/auth0-react');
    vi.mocked(useAuth0).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render Auth when not authenticated', () => {
    const { useAuth0 } = require('@auth0/auth0-react');
    vi.mocked(useAuth0).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(<App />);
    expect(screen.getByText(/Welcome to Harbor/i)).toBeInTheDocument();
  });

  it('should render Onboarding when profile is null', () => {
    const { useAuth0 } = require('@auth0/auth0-react');
    vi.mocked(useAuth0).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: 'test@example.com' },
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    } as any);

    vi.mocked(apiClient.apiFetch).mockRejectedValue(new Error('Not found'));

    render(<App />);
    waitFor(() => {
      expect(screen.getByText(/onboarding/i)).toBeInTheDocument();
    });
  });

  it('should render Dashboard for user role', async () => {
    const { useAuth0 } = require('@auth0/auth0-react');
    vi.mocked(useAuth0).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: 'test@example.com' },
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    } as any);

    vi.mocked(apiClient.apiFetch).mockResolvedValue({
      user_id: 'user1',
      role: 'user',
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Logged in as/i)).toBeInTheDocument();
    });
  });

  it('should render TherapistDashboard for therapist role', async () => {
    const { useAuth0 } = require('@auth0/auth0-react');
    vi.mocked(useAuth0).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: 'test@example.com' },
      getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    } as any);

    vi.mocked(apiClient.apiFetch).mockResolvedValue({
      user_id: 'therapist1',
      role: 'therapist',
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Logged in as/i)).toBeInTheDocument();
    });
  });
});
