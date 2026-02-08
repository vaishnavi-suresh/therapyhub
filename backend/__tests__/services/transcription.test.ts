import { transcribeAudio } from '../../api/services/transcription';

// Mock fetch globally
global.fetch = jest.fn();

describe('Transcription Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('transcribeAudio', () => {
    it('should return empty string if API key not configured', async () => {
      delete process.env.ELEVENLABS_API_KEY;
      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe('');
    });

    it('should download audio and transcribe successfully', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data'.repeat(100)); // Make it large enough (>1000 bytes)
      const mockTranscriptionResponse = {
        text: 'This is a test transcript',
        words: [],
      };

      const mockHeaders1 = {
        get: jest.fn((key: string) => {
          if (key === 'content-type') return 'video/mp4';
          return null;
        }),
      };

      const mockHeaders2 = {
        get: jest.fn(() => null),
      };

      // Mock audio download
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders1,
          arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
        })
        // Mock transcription API
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders2,
          json: jest.fn().mockResolvedValue(mockTranscriptionResponse),
        });

      const result = await transcribeAudio('https://example.com/audio.mp4');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('This is a test transcript');
    });

    it('should handle HTML response (not audio)', async () => {
      const mockHeaders = {
        get: jest.fn((key: string) => {
          if (key === 'content-type') return 'text/html';
          return null;
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('<html>').buffer),
      });

      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe(''); // Service catches error and returns empty string
    });

    it('should handle suspiciously small files', async () => {
      const mockHeaders = {
        get: jest.fn((key: string) => {
          if (key === 'content-type') return 'video/mp4';
          return null;
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('x'.repeat(100)).buffer), // Very small (<1000 bytes)
      });

      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe(''); // Service catches error and returns empty string
    });

    it('should extract transcript from words array if text field missing', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data'.repeat(100)); // Make it large enough
      const mockTranscriptionResponse = {
        text: '',
        words: [
          { text: 'Hello' },
          { text: 'world' },
          { text: '.' },
        ],
      };

      const mockHeaders1 = {
        get: jest.fn((key: string) => {
          if (key === 'content-type') return 'video/mp4';
          return null;
        }),
      };

      const mockHeaders2 = {
        get: jest.fn(() => null),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders1,
          arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders2,
          json: jest.fn().mockResolvedValue(mockTranscriptionResponse),
        });

      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe('Hello world.');
    });

    it('should handle multichannel transcripts', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data'.repeat(100)); // Make it large enough
      const mockTranscriptionResponse = {
        transcripts: [
          { text: 'Channel 1 text' },
          { text: 'Channel 2 text' },
        ],
      };

      const mockHeaders1 = {
        get: jest.fn((key: string) => {
          if (key === 'content-type') return 'video/mp4';
          return null;
        }),
      };

      const mockHeaders2 = {
        get: jest.fn(() => null),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders1,
          arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders2,
          json: jest.fn().mockResolvedValue(mockTranscriptionResponse),
        });

      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe('Channel 1 text\nChannel 2 text');
    });

    it('should handle transcription API errors', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data'.repeat(100)); // Make it large enough

      const mockHeaders = {
        get: jest.fn((key: string) => {
          if (key === 'content-type') return 'video/mp4';
          return null;
        }),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders,
          arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer.buffer),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: { get: jest.fn(() => null) },
          text: jest.fn().mockResolvedValue('Bad Request'),
        });

      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe('');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await transcribeAudio('https://example.com/audio.mp4');
      expect(result).toBe(''); // Service catches error and returns empty string
    });
  });
});
