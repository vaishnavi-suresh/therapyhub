import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from './Auth';

const mockUseAuth0 = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

describe('Auth', () => {
  it('should render loading state', () => {
    mockUseAuth0.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    render(<Auth />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render sign in form when not authenticated', () => {
    mockUseAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    render(<Auth />);
    expect(screen.getByText('Welcome to Harbor')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('should render signed in state', () => {
    mockUseAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: 'test@example.com', name: 'Test User' },
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    render(<Auth />);
    expect(screen.getByText('Signed in')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('should call loginWithRedirect when sign in clicked', async () => {
    const mockLogin = vi.fn();
    mockUseAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      loginWithRedirect: mockLogin,
      logout: vi.fn(),
    });

    render(<Auth />);
    await userEvent.click(screen.getByText('Sign in'));
    expect(mockLogin).toHaveBeenCalled();
  });

  it('should call logout when sign out clicked', async () => {
    const mockLogout = vi.fn();
    mockUseAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: 'test@example.com' },
      loginWithRedirect: vi.fn(),
      logout: mockLogout,
    });

    render(<Auth />);
    await userEvent.click(screen.getByText('Sign out'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
