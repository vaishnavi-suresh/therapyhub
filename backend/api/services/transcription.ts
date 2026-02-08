import dotenv from 'dotenv';
dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Transcribe a video/audio file using ElevenLabs Speech-to-Text API
 * @param audioUrl The URL of the audio/video file to transcribe
 * @returns The transcript text
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('⚠️ ELEVENLABS_API_KEY not configured, skipping transcription');
    return '';
  }

  try {
    console.log('🎤 Starting ElevenLabs transcription for:', audioUrl);

    // Create multipart form data
    // Note: FormData is available in Node.js 18+ globally
    const formData = new FormData();
    formData.append('model_id', 'scribe_v2'); // Use scribe_v2 (or scribe_v1)
    formData.append('cloud_storage_url', audioUrl);

    // Create a transcription request (synchronous)
    const createResponse = await fetch(`${ELEVENLABS_API_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        // Don't set Content-Type header - fetch will set it automatically with boundary for FormData
      },
      body: formData,
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Failed to create transcription:', errorText);
      throw new Error(`ElevenLabs transcription failed: ${createResponse.statusText}`);
    }

    const transcriptionData = await createResponse.json();
    
    // Extract transcript text from the response
    // The response structure has a 'text' field with the transcript
    const transcript = transcriptionData.text || '';
    
    if (transcript) {
      console.log('✅ Transcription completed:', transcript.substring(0, 100) + '...');
    } else {
      console.warn('⚠️ No transcript text in response:', transcriptionData);
    }

    return transcript;
  } catch (error) {
    console.error('❌ Transcription error:', error);
    // Don't throw - return empty string so recording can still be saved
    return '';
  }
}
