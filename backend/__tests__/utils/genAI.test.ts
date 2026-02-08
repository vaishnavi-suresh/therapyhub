import { createCarePlanFromData, createTherapistBotResponse, createTranscriptSummary } from '../../utils/genAI';

jest.mock('@google/genai', () => {
  const mockGenerateContent = jest.fn();
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

jest.mock('../../utils/prompts', () => ({
  treatmentPlanPrompt: jest.fn((messages, homeworks) => `Treatment plan prompt: ${messages} ${homeworks}`),
  therapeuticBotSystemPrompt: 'Therapeutic bot prompt',
  transcriptSummaryPrompt: jest.fn((transcript) => `Summary prompt: ${transcript}`),
}));

describe('GenAI Utils', () => {
  let mockAI: any;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { GoogleGenAI } = require('@google/genai');
    mockAI = new GoogleGenAI();
    mockGenerateContent = mockAI.models.generateContent;
  });

  describe('createCarePlanFromData', () => {
    it('should create care plan from messages and homeworks', async () => {
      const mockResponse = { text: 'Generated care plan' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const messages = ['Message 1', 'Message 2'];
      const homeworks = [{ homework_title: 'HW1' } as any, { homework_title: 'HW2' } as any];

      const result = await createCarePlanFromData(messages, homeworks);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Message 1'),
      });
      expect(result).toBe('Generated care plan');
    });

    it('should return empty string if response has no text', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      const result = await createCarePlanFromData([], []);

      expect(result).toBe('');
    });
  });

  describe('createTherapistBotResponse', () => {
    it('should create therapist bot response', async () => {
      const mockResponse = { text: 'Bot response' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const messages = ['User: Hello', 'Bot: Hi'];

      const result = await createTherapistBotResponse(messages);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('User: Hello'),
      });
      expect(result).toBe('Bot response');
    });
  });

  describe('createTranscriptSummary', () => {
    it('should create transcript summary', async () => {
      const mockResponse = { text: 'Session summary' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const transcript = 'Full transcript text';

      const result = await createTranscriptSummary(transcript);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Full transcript text'),
      });
      expect(result).toBe('Session summary');
    });
  });
});
