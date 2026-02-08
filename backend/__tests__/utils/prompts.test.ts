import {
  treatmentPlanPrompt,
  therapeuticBotSystemPrompt,
  transcriptSummaryPrompt,
} from '../../utils/prompts';

describe('Prompts Utils', () => {
  describe('treatmentPlanPrompt', () => {
    it('should generate treatment plan prompt with messages and homeworks', () => {
      const messages = 'Client message 1\nClient message 2';
      const homeworks = 'Homework 1\nHomework 2';
      const prompt = treatmentPlanPrompt(messages, homeworks);

      expect(prompt).toContain('treatment plan');
      expect(prompt).toContain('Client message 1');
      expect(prompt).toContain('Homework 1');
    });
  });

  describe('therapeuticBotSystemPrompt', () => {
    it('should be a string', () => {
      expect(typeof therapeuticBotSystemPrompt).toBe('string');
      expect(therapeuticBotSystemPrompt.length).toBeGreaterThan(0);
    });
  });

  describe('transcriptSummaryPrompt', () => {
    it('should generate transcript summary prompt', () => {
      const transcript = 'Full transcript text here';
      const prompt = transcriptSummaryPrompt(transcript);

      expect(prompt).toContain('transcript');
      expect(prompt).toContain('Full transcript text here');
    });
  });
});
