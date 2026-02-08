import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Auth0
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { email: 'test@example.com', name: 'Test User' },
    getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
  }),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock VideoSDK
vi.mock('@videosdk.live/react-sdk', () => ({
  MeetingProvider: ({ children }: { children: React.ReactNode }) => children,
  useMeeting: () => ({
    join: vi.fn(),
    leave: vi.fn(),
    toggleMic: vi.fn(),
    toggleWebcam: vi.fn(),
    startRecording: vi.fn().mockResolvedValue(undefined),
    stopRecording: vi.fn().mockResolvedValue(undefined),
    participants: new Map(),
    localParticipant: { id: 'local', micOn: true, webcamOn: true },
  }),
  useParticipant: () => ({
    micStream: null,
    webcamOn: true,
    micOn: true,
    isLocal: false,
    displayName: 'Participant',
  }),
  VideoPlayer: () => <div data-testid="video-player">Video Player</div>,
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
