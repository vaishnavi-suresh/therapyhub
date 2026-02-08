import dotenv from 'dotenv';
dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Guess filename from URL and content type
 */
function guessFilename(url: string, contentType: string): string {
  const base = url.split('?')[0].split('#')[0].split('/').pop() || 'audio';
  if (base.includes('.')) return base;

  if (contentType.includes('wav')) return `${base}.wav`;
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return `${base}.mp3`;
  if (contentType.includes('mp4')) return `${base}.mp4`;
  if (contentType.includes('webm')) return `${base}.webm`;
  return `${base}.bin`;
}

/**
 * Extract transcript from API response
 */
function extractTranscript(data: any): string {
  // Prefer text field if available (usually the best-formed output)
  if (typeof data?.text === 'string' && data.text.trim()) {
    return data.text.trim();
  }

  // Multichannel response
  if (Array.isArray(data?.transcripts)) {
    const combined = data.transcripts
      .map((t: any) => t?.text)
      .filter(Boolean)
      .join('\n')
      .trim();
    if (combined) return combined;
  }

  // Fallback: words array - join with spaces, handle punctuation properly
  if (Array.isArray(data?.words)) {
    const raw = data.words.map((w: any) => w?.text).filter(Boolean);
    const joined = raw.join(' ');
    // Fix spacing before punctuation
    return joined.replace(/\s+([,.!?;:])/g, '$1').trim();
  }

  return '';
}

/**
 * Transcribe a video/audio file using ElevenLabs Speech-to-Text API
 * Downloads the audio file and sends it as a binary upload for better reliability
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

    // 1) Download audio bytes ourselves to avoid redirect/auth/HTML issues
    console.log('📥 Downloading audio file...');
    const audioRes = await fetch(audioUrl, {
      // Some hosts require a browser-like UA to avoid returning HTML
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });

    if (!audioRes.ok) {
      const txt = await audioRes.text().catch(() => '');
      throw new Error(`Failed to fetch audioUrl (${audioRes.status}): ${txt.slice(0, 300)}`);
    }

    const contentType = audioRes.headers.get('content-type') || '';
    const audioBuf = Buffer.from(await audioRes.arrayBuffer());

    console.log('📊 Audio file info:', {
      contentType,
      size: audioBuf.length,
      sizeKB: Math.round(audioBuf.length / 1024),
    });

    // Defensive: if content-type looks like HTML, we didn't actually fetch audio
    if (contentType.includes('text/html')) {
      throw new Error(
        `audioUrl returned HTML (not audio). content-type=${contentType}. Host likely requires auth/confirmation.`
      );
    }

    // Defensive: if file is suspiciously small, it's probably not real audio
    if (audioBuf.length < 1000) {
      throw new Error(`Audio file is suspiciously small (${audioBuf.length} bytes). Likely not real audio.`);
    }

    // 2) Build form-data with FILE instead of cloud_storage_url
    const formData = new FormData();
    formData.append('model_id', 'scribe_v2');

    // Start with minimal parameters for best accuracy
    // Can add back diarization, event tagging, etc. after baseline is good
    // formData.append('diarize', 'false'); // omit entirely for now
    // formData.append('tag_audio_events', 'false'); // omit for now
    // formData.append('timestamps_granularity', 'word'); // can add back later

    // Attach audio file as Blob
    const filename = guessFilename(audioUrl, contentType);
    // In Node.js 18+, Blob is available globally
    const blob = new Blob([audioBuf], { type: contentType || 'application/octet-stream' });
    formData.append('file', blob, filename);

    console.log('📤 Uploading audio file to ElevenLabs:', {
      filename,
      contentType,
      size: audioBuf.length,
    });

    console.log('📋 Transcription parameters:', {
      model: 'scribe_v2',
      extras: 'minimal (diarization/events disabled for baseline accuracy)',
    });

    // 3) Send transcription request
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
      throw new Error(`ElevenLabs STT failed (${createResponse.status}): ${errorText}`);
    }

    const transcriptionData = await createResponse.json();
    
    // Log response structure for debugging
    console.log('📊 Transcription response structure:', {
      hasText: !!transcriptionData.text,
      textLength: transcriptionData.text?.length || 0,
      hasWords: !!transcriptionData.words,
      wordsCount: transcriptionData.words?.length || 0,
      hasTranscripts: !!transcriptionData.transcripts,
      transcriptsCount: Array.isArray(transcriptionData.transcripts) ? transcriptionData.transcripts.length : 0,
    });
    
    // Extract transcript using helper function
    const transcript = extractTranscript(transcriptionData);
    
    if (!transcript) {
      console.warn('⚠️ No transcript found. Full response:', JSON.stringify(transcriptionData, null, 2));
      return '';
    }

    console.log('✅ Transcription completed:', transcript.substring(0, 200) + (transcript.length > 200 ? '...' : ''));
    console.log(`📏 Full transcript length: ${transcript.length} characters`);

    return transcript;
  } catch (error) {
    console.error('❌ Transcription error:', error);
    // Don't throw - return empty string so recording can still be saved
    return '';
  }
}
