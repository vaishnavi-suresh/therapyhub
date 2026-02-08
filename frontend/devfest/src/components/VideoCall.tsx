import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  VideoPlayer,
} from '@videosdk.live/react-sdk';
import { apiFetch } from '../api/client';
import './VideoCall.css';

type VideoCallProps = {
  therapistId?: string | null;
  clientId?: string;
  userName?: string;
  userRole?: 'user' | 'therapist';
};

/**
 * Join Screen - Allows users to create or join a meeting
 */
function JoinScreen({
  onCreateMeeting,
  onJoinMeeting,
  userRole,
  meetingId: existingMeetingId,
}: {
  onCreateMeeting: () => void;
  onJoinMeeting: (meetingId: string) => void;
  userRole?: 'user' | 'therapist';
  meetingId?: string | null;
}) {
  const [meetingId, setMeetingId] = useState(existingMeetingId || '');

  const handleJoin = () => {
    const id = meetingId.trim();
    if (id) {
      onJoinMeeting(id);
    }
  };

  const isTherapist = userRole === 'therapist';
  const isClient = userRole === 'user';

  return (
    <div className="video-join-screen">
      <div className="video-join-card">
        <h2>Video Conference</h2>
        {isTherapist ? (
          <>
            <p className="video-join-description">
              Start a new session with your client. Share the meeting ID with them to join.
            </p>
            <div className="video-join-actions">
              <button
                type="button"
                className="video-btn video-btn-primary"
                onClick={onCreateMeeting}
              >
                Start New Session
              </button>
              {existingMeetingId && (
                <>
                  <div className="video-meeting-id-display">
                    <p className="video-meeting-id-label">Current Meeting ID:</p>
                    <p className="video-meeting-id-value">{existingMeetingId}</p>
                    <p className="video-meeting-id-hint">Share this ID with your client</p>
                  </div>
                </>
              )}
            </div>
          </>
        ) : isClient ? (
          <>
            <p className="video-join-description">
              Join your therapist's video session. Enter the meeting ID they provided.
            </p>
            <div className="video-join-actions">
              <div className="video-join-input-group">
                <input
                  type="text"
                  placeholder="Enter Meeting ID from your therapist"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJoin();
                    }
                  }}
                  className="video-input"
                />
                <button
                  type="button"
                  className="video-btn video-btn-primary"
                  onClick={handleJoin}
                  disabled={!meetingId.trim()}
                >
                  Join Session
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="video-join-description">
              Start a new session or join an existing one
            </p>
            <div className="video-join-actions">
              <button
                type="button"
                className="video-btn video-btn-primary"
                onClick={onCreateMeeting}
              >
                Start New Session
              </button>
              <div className="video-join-divider">
                <span>or</span>
              </div>
              <div className="video-join-input-group">
                <input
                  type="text"
                  placeholder="Enter Meeting ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJoin();
                    }
                  }}
                  className="video-input"
                />
                <button
                  type="button"
                  className="video-btn video-btn-secondary"
                  onClick={handleJoin}
                  disabled={!meetingId.trim()}
                >
                  Join
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Participant View - Renders a single participant's video and audio
 */
function ParticipantView({ participantId }: { participantId: string }) {
  const micRef = useRef<HTMLAudioElement>(null);
  const { micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(participantId);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error('micElem.current.play() failed', error)
          );
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className={`video-participant ${isLocal ? 'video-participant-local' : ''}`}>
      <div className="video-participant-info">
        <span className="video-participant-name">
          {isLocal ? 'You' : displayName || 'Participant'}
        </span>
        <div className="video-participant-status">
          <span className={`video-status-indicator ${webcamOn ? 'on' : 'off'}`}>
            {webcamOn ? 'Camera ON' : 'Camera OFF'}
          </span>
          <span className={`video-status-indicator ${micOn ? 'on' : 'off'}`}>
            {micOn ? 'Mic ON' : 'Mic OFF'}
          </span>
        </div>
      </div>
      {webcamOn ? (
        <div className="video-participant-video">
          <VideoPlayer
            participantId={participantId}
            type="video"
            containerStyle={{
              height: '100%',
              width: '100%',
            }}
            className="video-player"
            classNameVideo="video-player-element"
            videoStyle={{}}
          />
        </div>
      ) : (
        <div className="video-participant-placeholder">
          <div className="video-participant-avatar">
            {(displayName || 'U')[0].toUpperCase()}
          </div>
        </div>
      )}
      <audio ref={micRef} autoPlay playsInline muted={isLocal} />
    </div>
  );
}

/**
 * Controls - Meeting controls (mic, camera, leave)
 */
function Controls() {
  const { leave, toggleMic, toggleWebcam, localParticipant } = useMeeting();
  const micOn = localParticipant?.micOn ?? false;
  const webcamOn = localParticipant?.webcamOn ?? false;

  return (
    <div className="video-controls">
      <button
        type="button"
        className={`video-control-btn ${micOn ? 'active' : ''}`}
        onClick={() => toggleMic()}
        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        <span>{micOn ? 'Mute' : 'Unmute'}</span>
      </button>
      <button
        type="button"
        className={`video-control-btn ${webcamOn ? 'active' : ''}`}
        onClick={() => toggleWebcam()}
        title={webcamOn ? 'Turn off camera' : 'Turn on camera'}
      >
        <span>{webcamOn ? 'Camera On' : 'Camera Off'}</span>
      </button>
      <button
        type="button"
        className="video-control-btn video-control-btn-leave"
        onClick={() => leave()}
        title="Leave meeting"
      >
        <span>Leave</span>
      </button>
    </div>
  );
}

/**
 * Meeting View - Main meeting interface
 */
function MeetingView({
  meetingId,
  onMeetingLeave,
}: {
  meetingId: string;
  onMeetingLeave: () => void;
}) {
  const { getAccessTokenSilently } = useAuth0();
  const [joined, setJoined] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingStartedRef = useRef(false);
  const [shouldCheckStop, setShouldCheckStop] = useState(0); // Trigger to check if we should stop
  
  const { join, participants, localParticipant, startRecording, stopRecording } = useMeeting({
    onMeetingJoined: () => {
      setJoined('JOINED');
    },
    onMeetingLeft: () => {
      // Stop recording if still recording when leaving
      if (recordingStartedRef.current && isRecording) {
        try {
          stopRecording();
          recordingStartedRef.current = false;
          setIsRecording(false);
        } catch (error: any) {
          console.error('Failed to stop recording on meeting leave:', error);
        }
      }
      onMeetingLeave();
    },
    onParticipantLeft: () => {
      // Trigger a check to stop recording when participant leaves
      console.log('👋 Participant left event fired - current participants:', participants.size);
      setShouldCheckStop((prev) => prev + 1);
    },
  });

  const joinMeeting = () => {
    setJoined('JOINING');
    join();
  };

  const participantIds = [...participants.keys()].filter(
    (id) => id !== localParticipant?.id
  );

  // Count total participants - participants Map includes all participants including local
  // So we use participants.size directly
  const totalParticipants = participants.size;
  
  // Debug logging for participant count
  useEffect(() => {
    console.log('👥 Participant count changed:', { 
      totalParticipants, 
      isRecording, 
      recordingStarted: recordingStartedRef.current,
      joined 
    });
  }, [totalParticipants, isRecording, joined]);

  // Start recording when both participants join
  useEffect(() => {
    const handleStartRecording = async () => {
      console.log('🔍 Checking if should start recording:', { 
        totalParticipants, 
        recordingStarted: recordingStartedRef.current, 
        joined 
      });
      
      if (totalParticipants === 2 && !recordingStartedRef.current && joined === 'JOINED') {
        try {
          recordingStartedRef.current = true;
          setIsRecording(true);
          
          // Start recording (no webhook - will use manual save for localhost)
          console.log('🎬 Starting recording (localhost mode - manual save)');
          await startRecording();
          
          console.log('✅ Recording started successfully');
        } catch (error) {
          console.error('Failed to start recording:', error);
          recordingStartedRef.current = false;
          setIsRecording(false);
        }
      }
    };

    handleStartRecording();
  }, [totalParticipants, joined, startRecording]);

  // Stop recording when participants drop below 2 (check on participant count change or leave event)
  useEffect(() => {
    // This effect runs when totalParticipants, isRecording, joined, or shouldCheckStop changes
    // shouldCheckStop is incremented when onParticipantLeft fires, triggering this check
    if (totalParticipants < 2 && recordingStartedRef.current && isRecording && joined === 'JOINED') {
      console.log('🛑 Participant count dropped below 2, stopping recording. Count:', totalParticipants, 'shouldCheckStop:', shouldCheckStop);
      
      const handleStopAndSave = async () => {
        try {
          console.log('🛑 Calling stopRecording()...');
          stopRecording();
          recordingStartedRef.current = false;
          setIsRecording(false);
          console.log('✅ Recording stopped successfully - participants left (from useEffect)');
          
          // Fetch recording URL and save manually (localhost mode)
          console.log('🔧 Fetching recording URL and saving manually...');
          // Wait a bit for VideoSDK to process the recording
          setTimeout(async () => {
            try {
              const authToken = await getAccessTokenSilently({
                authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
              });
              
              // Get VideoSDK token for API calls
              console.log('📹 Fetching VideoSDK token for API calls...');
              const videoSDKTokenResponse = await apiFetch('/videosdk/token', {
                method: 'POST',
                token: authToken,
                body: JSON.stringify({ roomId: meetingId }),
              });
              
              const videoSDKToken = videoSDKTokenResponse.token;
              console.log('✅ Got VideoSDK token');
              
              // Fetch recordings from VideoSDK API by roomId
              console.log('📹 Fetching recordings from VideoSDK API for meeting:', meetingId);
              const recordingsResponse = await fetch(`https://api.videosdk.live/v2/recordings?roomId=${meetingId}`, {
                headers: {
                  'Authorization': videoSDKToken,
                  'Content-Type': 'application/json',
                },
              });
              
              if (recordingsResponse.ok) {
                const recordings = await recordingsResponse.json();
                console.log('📹 Fetched recordings list:', recordings);
                
                if (recordings.data && recordings.data.length > 0) {
                  // Get the latest recording (first in the list)
                  const latestRecording = recordings.data[0];
                  const recordingId = latestRecording.id || latestRecording.recordingId;
                  
                  console.log('📹 Latest recording ID:', recordingId);
                  
                  // Fetch the specific recording by ID to get fileUrl
                  if (recordingId) {
                    console.log('📹 Fetching recording details by ID:', recordingId);
                    const recordingDetailResponse = await fetch(`https://api.videosdk.live/v2/recordings/${recordingId}`, {
                      headers: {
                        'Authorization': videoSDKToken,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (recordingDetailResponse.ok) {
                      const recordingDetail = await recordingDetailResponse.json();
                      console.log('📹 Recording details:', recordingDetail);
                      
                      // Get fileUrl from the file object
                      const fileUrl = recordingDetail?.file?.fileUrl || recordingDetail?.fileUrl || recordingDetail?.file?.filePath;
                      
                      if (fileUrl) {
                        console.log('💾 Saving recording manually via API:', { meetingId, fileUrl });
                        await apiFetch('/meeting_recordings/manual-save', {
                          method: 'POST',
                          token: authToken,
                          body: JSON.stringify({ meetingId, fileUrl }),
                        });
                        console.log('✅ Recording saved successfully via manual endpoint');
                      } else {
                        console.warn('⚠️ No fileUrl found in recording details:', recordingDetail);
                      }
                    } else {
                      const errorText = await recordingDetailResponse.text();
                      console.error('❌ Failed to fetch recording details:', recordingDetailResponse.status, errorText);
                    }
                  } else {
                    console.warn('⚠️ No recordingId found in recording data');
                  }
                } else {
                  console.warn('⚠️ No recordings found in response');
                }
              } else {
                const errorText = await recordingsResponse.text();
                console.error('❌ Failed to fetch recordings:', recordingsResponse.status, errorText);
              }
            } catch (error) {
              console.error('❌ Failed to fetch/save recording manually:', error);
            }
          }, 5000); // Wait 5 seconds for VideoSDK to process
        } catch (error: any) {
          console.error('❌ Failed to stop recording:', error);
        }
      };
      
      handleStopAndSave();
    }
  }, [totalParticipants, isRecording, joined, shouldCheckStop, stopRecording, meetingId, getAccessTokenSilently]);

  // Also stop recording when meeting ends
  useEffect(() => {
    return () => {
      if (recordingStartedRef.current && isRecording) {
        try {
          stopRecording();
        } catch (error) {
          console.error('Failed to stop recording on unmount:', error);
        }
      }
    };
  }, [isRecording, stopRecording]);

  return (
    <div className="video-meeting-view">
      <div className="video-meeting-header">
        <h3>Meeting: {meetingId}</h3>
        {isRecording && (
          <span className="video-recording-indicator">Recording...</span>
        )}
      </div>
      {joined === 'JOINED' ? (
        <div className="video-meeting-content">
          <div className="video-participants-grid">
            {participantIds.map((participantId) => (
              <ParticipantView participantId={participantId} key={participantId} />
            ))}
            {participantIds.length === 0 && (
              <div className="video-waiting">
                <p>Waiting for participants to join...</p>
              </div>
            )}
          </div>
          {localParticipant && (
            <div className="video-local-participant-overlay">
              <ParticipantView
                participantId={localParticipant.id}
                key={localParticipant.id}
              />
            </div>
          )}
          <Controls />
        </div>
      ) : joined === 'JOINING' ? (
        <div className="video-joining">
          <p>Joining the meeting...</p>
        </div>
      ) : (
        <div className="video-meeting-ready">
          <p>Ready to join the meeting</p>
          <button
            type="button"
            className="video-btn video-btn-primary"
            onClick={joinMeeting}
          >
            Join Meeting
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Main VideoCall Component
 */
export default function VideoCall({
  userName,
  userRole,
  clientId,
}: VideoCallProps) {
  const { getAccessTokenSilently } = useAuth0();
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMeeting = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });

      const data = (await apiFetch('/videosdk/meeting', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({ client_id: clientId || null }),
      })) as { meetingId: string; token: string };

      setMeetingId(data.meetingId);
      setToken(data.token);
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError('Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const authToken = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });

      // Validate meeting first
      await apiFetch(`/videosdk/meeting/${id}/validate`, {
        token: authToken,
      });

      // Generate token for joining
      const tokenData = (await apiFetch('/videosdk/token', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({ roomId: id }),
      })) as { token: string };

      setMeetingId(id);
      setToken(tokenData.token);
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. Please check the meeting ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const onMeetingLeave = () => {
    setMeetingId(null);
    setToken(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="video-call-container">
        <div className="video-loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-call-container">
        <div className="video-error">
          <p>{error}</p>
          <button
            type="button"
            className="video-btn video-btn-primary"
            onClick={() => {
              setError(null);
              setMeetingId(null);
              setToken(null);
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (token && meetingId) {
    return (
      <MeetingProvider
        config={{
          meetingId,
          micEnabled: true,
          webcamEnabled: true,
          name: userName || 'User',
        } as any}
        token={token}
      >
        <div className="video-call-container">
          <MeetingView
            meetingId={meetingId}
            onMeetingLeave={onMeetingLeave}
          />
        </div>
      </MeetingProvider>
    );
  }

  const handleCreateMeeting = userRole === 'therapist' ? createMeeting : () => {
    setError('Only therapists can start video sessions. Please wait for your therapist to start a session.');
  };

  return (
    <div className="video-call-container">
      <JoinScreen 
        onCreateMeeting={handleCreateMeeting}
        onJoinMeeting={joinMeeting}
        userRole={userRole}
        meetingId={meetingId}
      />
    </div>
  );
}
